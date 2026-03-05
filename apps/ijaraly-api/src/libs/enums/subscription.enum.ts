export enum SubscriptionPlan {
	FREE = 'FREE',
	BASIC = 'BASIC',
	PRO = 'PRO',
}

export const SubscriptionPlanValues = Object.values(SubscriptionPlan);

export const SUBSCRIPTION_LISTING_LIMITS: Record<SubscriptionPlan, number> = {
	[SubscriptionPlan.FREE]: 3,
	[SubscriptionPlan.BASIC]: 20,
	[SubscriptionPlan.PRO]: Infinity,
};

export const SUBSCRIPTION_PRICES_UZS: Record<SubscriptionPlan, number> = {
	[SubscriptionPlan.FREE]: 0,
	[SubscriptionPlan.BASIC]: 99_000,
	[SubscriptionPlan.PRO]: 249_000,
};

export const BOOST_PRICES_UZS: Record<number, number> = {
	7: 49_000,
	14: 89_000,
	30: 149_000,
};
