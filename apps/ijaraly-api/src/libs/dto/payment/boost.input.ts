import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsString } from 'class-validator';
import { PaymentProvider } from '../../enums/payment.enum';

@InputType()
export class InitiateBoostInput {
	@Field(() => String)
	@IsString()
	propertyId: string;

	@Field(() => Int)
	@IsIn([7, 14, 30])
	days: number;

	@Field(() => String)
	@IsEnum(PaymentProvider)
	provider: PaymentProvider;
}
