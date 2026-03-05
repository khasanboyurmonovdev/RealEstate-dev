import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class InitiatePaymentResult {
	@Field(() => String)
	orderId: string;

	@Field(() => String)
	redirectUrl: string;

	@Field(() => Int)
	amountUZS: number;
}

@ObjectType()
export class PaymentRecord {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	memberId: string;

	@Field(() => Int)
	amountUZS: number;

	@Field(() => String)
	provider: string;

	@Field(() => String)
	status: string;

	@Field(() => String, { nullable: true })
	transactionId: string | null;

	@Field(() => String)
	orderId: string;

	@Field(() => String)
	purpose: string;

	@Field(() => String, { nullable: true })
	referenceId: string | null;

	@Field(() => Date, { nullable: true })
	completedAt: Date | null;

	@Field(() => Date)
	createdAt: Date;
}
