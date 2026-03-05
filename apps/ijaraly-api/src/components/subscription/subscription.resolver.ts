import { Resolver, Query, ObjectType, Field, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Member } from '../../libs/dto/member/member';
import { SubscriptionService } from './subscription.service';

@ObjectType()
export class SubscriptionInfo {
	@Field(() => String)
	plan: string;

	@Field(() => Date, { nullable: true })
	expiresAt: Date | null;

	@Field(() => Boolean)
	isActive: boolean;

	@Field(() => Int)
	listingsUsed: number;

	@Field(() => Int)
	listingsLimit: number;

	@Field(() => Int)
	priceUZS: number;
}

@Resolver()
export class SubscriptionResolver {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	@Query(() => SubscriptionInfo)
	@UseGuards(AuthGuard)
	public async getMySubscription(@AuthMember() authMember: Member): Promise<SubscriptionInfo> {
		return this.subscriptionService.getMySubscription(authMember._id as unknown as string);
	}
}
