import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, Length } from 'class-validator';

@InputType()
export class SendOtpInput {
	@IsNotEmpty()
	@Field(() => String)
	memberPhone: string;
}

@InputType()
export class VerifyOtpInput {
	@IsNotEmpty()
	@Field(() => String)
	memberPhone: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	otpCode: string;
}

@ObjectType()
export class OtpResponse {
	@Field(() => Boolean)
	success: boolean;
}
