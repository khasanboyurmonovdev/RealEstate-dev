import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { Notification } from '../../libs/dto/notification/notification';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Query(() => [Notification])
	public async getNotifications(@AuthMember('_id') memberId: ObjectId): Promise<Notification[]> {
		console.log('Query: getNotifications');
		const result = await this.notificationService.getNotifications(memberId);
		return result.list;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async updateNotification(
		@Args('input') input: String,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: updateNotification');
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.updateNotification(memberId, notificationId);
	}
}
