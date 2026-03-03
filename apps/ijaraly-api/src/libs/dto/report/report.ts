import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ReportReason, ReportStatus } from '../../enums/report.enum';

@ObjectType()
export class Report {
	@Field(() => ID)
	_id: ObjectId;

	@Field(() => ID)
	propertyId: ObjectId;

	@Field(() => ID)
	reporterId: ObjectId;

	@Field(() => ReportReason)
	reason: ReportReason;

	@Field(() => String, { nullable: true })
	description?: string;

	@Field(() => ReportStatus)
	status: ReportStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
