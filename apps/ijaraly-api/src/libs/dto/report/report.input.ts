import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '../../enums/report.enum';

@InputType()
export class CreateReportInput {
	@IsNotEmpty()
	@Field(() => String)
	propertyId: string;

	@IsNotEmpty()
	@Field(() => ReportReason)
	reason: ReportReason;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	@Field(() => String, { nullable: true })
	description?: string;
}
