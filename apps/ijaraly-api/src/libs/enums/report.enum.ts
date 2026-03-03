import { registerEnumType } from '@nestjs/graphql';

export enum ReportReason {
	FAKE = 'FAKE',
	WRONG_PRICE = 'WRONG_PRICE',
	SPAM = 'SPAM',
	ALREADY_RENTED = 'ALREADY_RENTED',
	OTHER = 'OTHER',
}
registerEnumType(ReportReason, {
	name: 'ReportReason',
});

export enum ReportStatus {
	PENDING = 'PENDING',
	REVIEWED = 'REVIEWED',
	DISMISSED = 'DISMISSED',
}
registerEnumType(ReportStatus, {
	name: 'ReportStatus',
});
