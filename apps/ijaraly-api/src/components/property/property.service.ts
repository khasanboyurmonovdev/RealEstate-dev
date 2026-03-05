// Phase 4 Task 9b
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Properties, Property } from '../../libs/dto/property/property';
import { Member } from '../../libs/dto/member/member';
import {
	AgentPropertiesInquiry,
	AllPropertiesInquiry,
	OrdinaryInquiry,
	PropertiesInquiry,
	PropertyInput,
} from '../../libs/dto/property/property.input';
import { DeviceType } from '../../libs/decorators/device-type.decorator';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { MemberStatus } from '../../libs/enums/member.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { VerificationStatus } from '../../libs/enums/verification.enum';
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
import { SubscriptionService } from '../subscription/subscription.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class PropertyService {
	private readonly logger = new Logger('PropertyService');

	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
		private eventEmitter: EventEmitter2,
		private readonly subscriptionService: SubscriptionService,
		private readonly aiService: AiService,
	) {}

	public async createProperty(ownerId: ObjectId, input: PropertyInput): Promise<Property> {
		await this.subscriptionService.checkListingLimit(ownerId as unknown as string);
		let doc: any;
		try {
			const isDuplicate = await this.checkDuplicateListing(ownerId, input);

			const propertyData: any = {
				...input,
				owner: ownerId,
			};

			if (input.coordinates) {
				propertyData.location = {
					type: 'Point',
					coordinates: [input.coordinates.lng, input.coordinates.lat],
				};
			}

			if (isDuplicate) {
				propertyData.verificationStatus = VerificationStatus.UNDER_REVIEW;
			}

			doc = propertyData;

			const result = await this.propertyModel.create(doc);

			await this.memberService.memberStatsEditor({
				_id: result.owner,
				targetKey: 'memberProperties',
				modifier: 1,
			});

			if (isDuplicate) {
				this.logger.warn(
					`Duplicate listing detected for owner ${ownerId}: address="${input.propertyAddress}", price=${input.propertyPrice}`,
				);
				result.isDuplicateWarning = true;
			}

			try {
				const fakeScore = await this.aiService.scoreFakeListing(result);
				if (fakeScore.flagged) {
					this.logger.warn(
						`Listing flagged as suspicious (score: ${fakeScore.score}): ${result._id} — ${fakeScore.reasons.join(', ')}`,
					);
					await this.propertyModel.findByIdAndUpdate(result._id, {
						$set: { verificationStatus: VerificationStatus.UNDER_REVIEW },
					});
				}
			} catch (err) {
				this.logger.error('Fake score check failed silently', err);
			}

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

	private async checkDuplicateListing(ownerId: ObjectId, input: PropertyInput): Promise<boolean> {
		if (!input.propertyAddress) return false;

		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const priceLow = input.propertyPrice * 0.9;
		const priceHigh = input.propertyPrice * 1.1;

		const existing = await this.propertyModel.findOne({
			owner: ownerId,
			propertyAddress: { $regex: new RegExp(`^${input.propertyAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
			propertyPrice: { $gte: priceLow, $lte: priceHigh },
			createdAt: { $gte: sevenDaysAgo },
		}).exec();

		return !!existing;
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

		if (input.coordinates) {
			(input as any).location = {
				type: 'Point',
				coordinates: [input.coordinates.lng, input.coordinates.lat],
			};
		}

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

	public async getProperties(
		memberId: ObjectId,
		input: PropertiesInquiry,
		deviceType: DeviceType = 'desktop',
	): Promise<Properties> {
		const match: T = { propertyStatus: PropertyStatus.ACTIVE };

		const { nearLat, nearLng, nearRadiusKm } = input.search ?? {};
		if (nearLat != null && nearLng != null && nearRadiusKm != null) {
			match['location'] = {
				$geoWithin: {
					$centerSphere: [
						[nearLng, nearLat],
						(nearRadiusKm * 1000) / 6378137,
					],
				},
			};
		}

		const sort: T = { boostedUntil: -1, [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match:', match);

		// On mobile, trim images array to the first image only to reduce payload
		const imageSliceStage =
			deviceType === 'mobile'
				? [{ $addFields: { images: { $slice: ['$images', 1] } } }]
				: [];

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
							...imageSliceStage,
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
			city,
			listingType,
			propertyType,
			minPrice,
			maxPrice,
			text,
		} = input.search;

		if (memberId) match.owner = shapeIntoMongoObjectId(memberId);

		if (district) match.district = district;
		else if (districtList && districtList.length) match.district = { $in: districtList };

		if (city) match.city = city;

		if (listingType) match.listingType = listingType;

		if (propertyType) match.propertyType = propertyType;

		if (minPrice != null || maxPrice != null) {
			match.propertyPrice = {} as T;
			if (minPrice != null) (match.propertyPrice as Record<string, number>).$gte = minPrice;
			if (maxPrice != null) (match.propertyPrice as Record<string, number>).$lte = maxPrice;
		}

		if (text) {
			match.$or = [
				{ propertyTitle: { $regex: new RegExp(text, 'i') } },
				{ propertyDesc: { $regex: new RegExp(text, 'i') } },
			];
		}
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

	/** ─── Admin verification ─── */

	public async verifyProperty(propertyId: ObjectId, adminId: ObjectId): Promise<Property> {
		const result = await this.propertyModel
			.findByIdAndUpdate(
				propertyId,
				{
					verificationStatus: VerificationStatus.VERIFIED,
					verifiedAt: new Date(),
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const notifInput: NotificationInput = {
			notificationGroup: NotificationGroup.PROPERTY,
			notificationType: NotificationType.VERIFICATION,
			notificationTitle: 'Property Verified!',
			notificationDesc: 'Your property listing has been verified by an admin.',
			authorId: adminId,
			receiverId: result.owner,
			propertyId: propertyId,
		};
		await this.notificationService.createNotification(notifInput);

		this.eventEmitter.emit('property.verified', {
			propertyId: propertyId,
			memberId: result.owner,
		});

		return result;
	}

	public async rejectProperty(propertyId: ObjectId, reason: string, adminId: ObjectId): Promise<Property> {
		const result = await this.propertyModel
			.findByIdAndUpdate(
				propertyId,
				{
					verificationStatus: VerificationStatus.REJECTED,
					rejectionReason: reason,
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const updatedMember: Member = await this.memberModel
			.findByIdAndUpdate(
				result.owner,
				{ $inc: { memberWarnings: 1 } },
				{ new: true },
			)
			.exec();

		this.eventEmitter.emit('property.rejected', {
			propertyId: propertyId,
			memberId: result.owner,
			reason: reason,
		});

		if (updatedMember) {
			if (updatedMember.memberWarnings >= 5) {
				await this.memberModel
					.findByIdAndUpdate(result.owner, { memberStatus: MemberStatus.BLOCK })
					.exec();
				this.eventEmitter.emit('member.blocked', { memberId: result.owner });
			} else if (updatedMember.memberWarnings >= 3) {
				this.eventEmitter.emit('member.warning', {
					memberId: result.owner,
					warnings: updatedMember.memberWarnings,
				});
			}
		}

		return result;
	}

	public async flagForReview(propertyId: ObjectId): Promise<Property> {
		const result = await this.propertyModel
			.findByIdAndUpdate(
				propertyId,
				{ verificationStatus: VerificationStatus.UNDER_REVIEW },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	/** ─── Reactivation ─── */

	public async reactivateListing(propertyId: ObjectId, memberId: ObjectId): Promise<Property> {
		const property = await this.propertyModel.findById(propertyId).exec();
		if (!property) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (property.owner.toString() !== memberId.toString()) {
			throw new ForbiddenException('NOT_OWNER');
		}

		if (property['propertyStatus'] !== PropertyStatus.EXPIRED) {
			throw new BadRequestException('PROPERTY_NOT_EXPIRED');
		}

		const result = await this.propertyModel
			.findByIdAndUpdate(
				propertyId,
				{
					propertyStatus: PropertyStatus.ACTIVE,
					verificationStatus: VerificationStatus.PENDING,
					createdAt: new Date(),
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getSimilarProperties(propertyId: string): Promise<any[]> {
		const property = await this.propertyModel.findById(propertyId).lean().exec();
		if (!property) return [];

		const priceMin = property.propertyPrice * 0.5;
		const priceMax = property.propertyPrice * 1.5;

		return this.propertyModel
			.find({
				_id: { $ne: property._id },
				district: property.district,
				propertyPrice: { $gte: priceMin, $lte: priceMax },
				propertyStatus: 'ACTIVE',
			})
			.limit(4)
			.lean()
			.exec();
	}
}
