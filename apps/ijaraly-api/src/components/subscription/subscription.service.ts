import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { SubscriptionPlan, SUBSCRIPTION_LISTING_LIMITS, SUBSCRIPTION_PRICES_UZS } from '../../libs/enums/subscription.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class SubscriptionService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async getMySubscription(memberId: string): Promise<{
		plan: SubscriptionPlan;
		expiresAt: Date | null;
		isActive: boolean;
		listingsUsed: number;
		listingsLimit: number;
		priceUZS: number;
	}> {
		const member = await this.memberModel.findById(memberId).exec();
		if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);

		const plan: SubscriptionPlan = (member as any).subscriptionPlan ?? SubscriptionPlan.FREE;
		const expiresAt: Date | null = (member as any).subscriptionExpiresAt ?? null;
		const isActive = plan === SubscriptionPlan.FREE || (expiresAt ? expiresAt > new Date() : false);
		const listingsLimit = SUBSCRIPTION_LISTING_LIMITS[plan];
		const listingsUsed = member.memberProperties ?? 0;

		return {
			plan,
			expiresAt,
			isActive,
			listingsUsed,
			listingsLimit: listingsLimit === Infinity ? -1 : listingsLimit,
			priceUZS: SUBSCRIPTION_PRICES_UZS[plan],
		};
	}

	public async checkListingLimit(memberId: string): Promise<void> {
		const member = await this.memberModel.findById(memberId).exec();
		if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);

		const plan: SubscriptionPlan = (member as any).subscriptionPlan ?? SubscriptionPlan.FREE;
		const expiresAt: Date | null = (member as any).subscriptionExpiresAt ?? null;

		// If paid plan has expired, fall back to FREE limits
		const effectivePlan =
			plan === SubscriptionPlan.FREE || (expiresAt && expiresAt > new Date())
				? plan
				: SubscriptionPlan.FREE;

		const limit = SUBSCRIPTION_LISTING_LIMITS[effectivePlan];
		const used = member.memberProperties ?? 0;

		if (limit !== Infinity && used >= limit) {
			throw new BadRequestException(
				`LISTING_LIMIT_REACHED: Your ${effectivePlan} plan allows ${limit} listing(s). Upgrade to post more.`,
			);
		}
	}

	public async activateSubscription(
		memberId: string,
		plan: SubscriptionPlan,
	): Promise<Member> {
		if (plan === SubscriptionPlan.FREE) {
			throw new BadRequestException('Cannot activate FREE plan via payment');
		}

		const now = new Date();
		const expiresAt = new Date(now);
		expiresAt.setMonth(expiresAt.getMonth() + 1);

		const updated = await this.memberModel
			.findByIdAndUpdate(
				memberId,
				{
					$set: {
						subscriptionPlan: plan,
						subscriptionExpiresAt: expiresAt,
					},
				},
				{ new: true },
			)
			.exec();

		if (!updated) throw new BadRequestException(Message.NO_DATA_FOUND);
		return updated;
	}

	public async downgradeExpiredSubscriptions(): Promise<void> {
		const now = new Date();
		await this.memberModel.updateMany(
			{
				subscriptionPlan: { $ne: SubscriptionPlan.FREE },
				subscriptionExpiresAt: { $lt: now },
			},
			{
				$set: {
					subscriptionPlan: SubscriptionPlan.FREE,
					subscriptionExpiresAt: null,
				},
			},
		).exec();
	}
}
