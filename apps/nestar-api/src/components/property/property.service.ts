import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Properties, Property } from '../../libs/dto/property/property';
import {
	AgentPropertiesInquiry,
	AllPropertiesInquiry,
	OrdinaryInquiry,
	PropertiesInquiry,
	PropertyInput,
} from '../../libs/dto/property/property.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { lookupAuthMemberLiked, lookupPropertyOwner, shapeIntoMongoObjectId } from '../../libs/config';
import { PropertyUpdate } from '../../libs/dto/property/porperty.update';
import * as moment from 'moment';
import { LikeService } from '../like/like.service';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PropertyService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
	) {}

	public async createProperty(ownerId: ObjectId, input: PropertyInput): Promise<Property> {
		let doc: any;
		try {
			doc = { ...input, owner: ownerId };
			const result = await this.propertyModel.create(doc);
			await this.memberService.memberStatsEditor({
				_id: result.owner,
				targetKey: 'memberProperties',
				modifier: 1,
			});
			return result;
		} catch (err) {
			console.error('createProperty FULL ERROR:', err);
			console.error('createProperty ERR.ERRORS:', (err as any)?.errors);
			console.error('createProperty DOC:', doc);

			const message =
				(err as any)?.errors
					? Object.values((err as any).errors)
							.map((e: any) => e?.message)
							.join(', ')
					: (err as any)?.message || Message.CREATE_FAILED;

			throw new BadRequestException(message);
		}
	}

	public async getProperty(memberId: ObjectId, propertyId: ObjectId): Promise<Property> {
		const search: T = {
			_id: propertyId,
			propertyStatus: PropertyStatus.ACTIVE,
		};

		const targetProperty: Property = await this.propertyModel.findOne(search).lean<Property>().exec();
		if (!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY };
			const newWiew = await this.viewService.recordView(viewInput);

			if (newWiew) {
				await this.propertyStatsEditor({ _id: propertyId, targetKey: 'propertyViews', modifier: 1 });
				targetProperty.propertyViews++;
			}

			const likeInput = { memberId: memberId, likeRefId: propertyId, likeGroup: LikeGroup.PROPERTY };
			targetProperty.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetProperty.memberData = await this.memberService.getMember(null, targetProperty.owner);
		return targetProperty;
	}

	public async updateProperty(memberId: ObjectId, input: PropertyUpdate): Promise<Property> {
		let { propertyStatus, soldAt, deletedAt } = input;
		const search: T = {
			_id: input._id,
			owner: memberId,
			propertyStatus: PropertyStatus.ACTIVE,
		};

		if (propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
		else if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.propertyModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberProperties',
				modifier: -1,
			});
		}

		return result;
	}

	public async getProperties(memberId: ObjectId, input: PropertiesInquiry): Promise<Properties> {
		const match: T = { propertyStatus: PropertyStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match:', match);

		const result = await this.propertyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupPropertyOwner,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Properties> {
		return await this.likeService.getFavoriteProperties(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Properties> {
		return await this.viewService.getVisitedProperties(memberId, input);
	}

	private shapeMatchQuery(match: T, input: PropertiesInquiry): void {
		const {
			memberId,
			district,
			districtList,
			minPrice,
			maxPrice,
			rooms,
			roomsList,
			propertyType,
			propertyTypeList,
			furnished,
			renovation,
			metroNearby,
			periodsRange,
			areaRange,
			text,
		} = input.search;

		if (memberId) match.owner = shapeIntoMongoObjectId(memberId);

		// District: single or list
		if (district) match.district = district;
		else if (districtList && districtList.length) match.district = { $in: districtList };

		// Price: min and/or max
		if (minPrice != null || maxPrice != null) {
			match.price = {} as T;
			if (minPrice != null) (match.price as Record<string, number>).$gte = minPrice;
			if (maxPrice != null) (match.price as Record<string, number>).$lte = maxPrice;
		}

		// Rooms: single or list
		if (rooms != null) match.rooms = rooms;
		else if (roomsList && roomsList.length) match.rooms = { $in: roomsList };

		// Property type: single or list
		if (propertyType) match.propertyType = propertyType;
		else if (propertyTypeList && propertyTypeList.length) match.propertyType = { $in: propertyTypeList };

		if (furnished != null) match.furnished = furnished;
		if (renovation != null) match.renovation = renovation;
		if (metroNearby != null) match.metroNearby = metroNearby;

		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (areaRange) match.area = { $gte: areaRange.start, $lte: areaRange.end };

		if (text) match.title = { $regex: new RegExp(text, 'i') };
	}

	public async getAgentProperties(memberId: ObjectId, input: AgentPropertiesInquiry): Promise<Properties> {
		const { propertyStatus } = input.search;
		if (propertyStatus === PropertyStatus.DELETE) throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			owner: memberId,
			propertyStatus: propertyStatus ?? { $ne: PropertyStatus.DELETE },
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.propertyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupPropertyOwner,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
	public async likeTargetProperty(memberId: ObjectId, likeRefId: ObjectId): Promise<Property> {
		const target: Property = await this.propertyModel
			.findOne({ _id: likeRefId, propertyStatus: PropertyStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.PROPERTY,
		};
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.propertyStatsEditor({
			_id: likeRefId,
			targetKey: 'propertyLikes',
			modifier: modifier,
		});
		if (modifier === 1) {
			const notifInput: NotificationInput = {
				notificationGroup: NotificationGroup.PROPERTY,
				notificationType: NotificationType.LIKE,
				notificationTitle: 'Property Liked!',
				notificationDesc: 'Someone liked your property!',
				authorId: memberId,
				receiverId: target.owner,
				propertyId: likeRefId,
			};
			await this.notificationService.createNotification(notifInput);
		}
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllPropertiesByAdmin(input: AllPropertiesInquiry): Promise<Properties> {
		const { propertyStatus, districtList } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (propertyStatus) match.propertyStatus = propertyStatus;
		if (districtList) match.district = { $in: districtList };

		const result = await this.propertyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupPropertyOwner,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updatePropertyByAdmin(input: PropertyUpdate): Promise<Property> {
		let { propertyStatus, soldAt, deletedAt } = input;
		const search: T = {
			_id: input._id,
			propertyStatus: PropertyStatus.ACTIVE,
		};

		if (propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
		else if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.propertyModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.owner,
				targetKey: 'memberProperties',
				modifier: -1,
			});
		}
		return result;
	}

	public async removePropertyByAdmin(propertyId: ObjectId): Promise<Property> {
		const search: T = { _id: propertyId, propertyStatus: PropertyStatus.DELETE };
		const result = await this.propertyModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async propertyStatsEditor(input: StatisticModifier): Promise<Property> {
		const { _id, targetKey, modifier } = input;
		return await this.propertyModel
			.findOneAndUpdate(
				{ _id },
				{
					$inc: { [targetKey]: modifier },
				},
				{
					new: true,
				},
			)
			.exec();
	}
}
