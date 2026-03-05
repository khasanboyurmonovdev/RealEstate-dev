import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentProvider, PaymentPurpose } from '../../enums/payment.enum';
import { SubscriptionPlan } from '../../enums/subscription.enum';

@InputType()
export class InitiatePaymentInput {
	@Field(() => String)
	@IsEnum(PaymentPurpose)
	purpose: PaymentPurpose;

	@Field(() => String)
	@IsEnum(PaymentProvider)
	provider: PaymentProvider;

	// For BOOKING purpose
	@Field(() => String, { nullable: true })
	@IsOptional()
	@IsString()
	bookingId?: string;

	// For SUBSCRIPTION purpose
	@Field(() => String, { nullable: true })
	@IsOptional()
	@IsEnum(SubscriptionPlan)
	subscriptionPlan?: SubscriptionPlan;
}
