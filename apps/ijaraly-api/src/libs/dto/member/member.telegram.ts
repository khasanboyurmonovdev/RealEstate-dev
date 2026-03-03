import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class TelegramAuthInput {
	@IsNotEmpty()
	@Field(() => String)
	id: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	first_name?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	last_name?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	username?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	photo_url?: string;

	@IsNotEmpty()
	@Field(() => String)
	auth_date: string;

	@IsNotEmpty()
	@Field(() => String)
	hash: string;
}
