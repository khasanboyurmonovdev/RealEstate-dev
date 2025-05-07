import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { MemberService } from '../member/member.service';
import { PropertyService } from '../property/property.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';

import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationInput } from '../../libs/dto/notification/notification.input';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private readonly memberService: MemberService,
		private readonly propertyService: PropertyService,
		private readonly boardArticleService: BoardArticleService,
		private notificationService: NotificationService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;
		input.commentRefId = shapeIntoMongoObjectId(input.commentRefId);
		let result = null;
		try {
			result = await this.commentModel.create(input);
		} catch (err) {
			console.log('Comment Service Error: createComment', err);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}

		const notifInput: NotificationInput = {
			notificationGroup: null,
			notificationType: NotificationType.COMMENT,
			notificationTitle: '',
			notificationDesc: '',
			authorId: memberId,
			receiverId: null,
		};

		let target: any;
		switch (input.commentGroup) {
			case CommentGroup.PROPERTY:
				target = await this.propertyService.propertyStatsEditor({
					_id: input.commentRefId,
					targetKey: 'propertyComments',
					modifier: 1,
				});
				notifInput.notificationGroup = NotificationGroup.PROPERTY;
				notifInput.notificationTitle = 'Property Comment!';
				notifInput.notificationDesc = 'Someone commented on your property!';
				notifInput.receiverId = target.memberId;
				notifInput.propertyId = input.commentRefId;

				break;
			case CommentGroup.ARTICLE:
				target = await this.boardArticleService.boardArticleStatsEditor({
					_id: input.commentRefId,
					targetKey: 'articleComments',
					modifier: 1,
				});
				notifInput.notificationGroup = NotificationGroup.ARTICLE;
				notifInput.notificationTitle = 'Article Comment!';
				notifInput.notificationDesc = 'Someone commented on your article!';
				notifInput.receiverId = target.memberId;
				notifInput.articleId = input.commentRefId;
				break;
			case CommentGroup.MEMBER:
				await this.memberService.StatisticModifier({
					_id: input.commentRefId,
					targetKey: 'memberComments',
					modifier: 1,
				});
				notifInput.notificationGroup = NotificationGroup.MEMBER;
				notifInput.notificationTitle = 'Profile Comment!';
				notifInput.notificationDesc = 'Someone commented on your profile!';
				notifInput.receiverId = input.commentRefId;
				break;
		}
		await this.notificationService.createNotification(notifInput);

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id } = input;
		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id: _id,
					memberId: memberId,
					commentStatus: CommentStatus.ACTIVE,
				},
				input,
				{
					new: true,
				},
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;
		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Comments[] = await this.commentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// meliked
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(input).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
