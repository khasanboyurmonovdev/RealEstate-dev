import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class VerifyPropertyInput {
	@IsNotEmpty()
	@Field(() => String)
	propertyId: string;
}

@InputType()
export class RejectPropertyInput {
	@IsNotEmpty()
	@Field(() => String)
	propertyId: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	reason: string;
}

@InputType()
export class FlagPropertyInput {
	@IsNotEmpty()
	@Field(() => String)
	propertyId: string;
}
