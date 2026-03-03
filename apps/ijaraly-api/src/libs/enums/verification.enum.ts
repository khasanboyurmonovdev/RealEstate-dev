import { registerEnumType } from '@nestjs/graphql';

export enum VerificationStatus {
	PENDING = 'PENDING',
	UNDER_REVIEW = 'UNDER_REVIEW',
	VERIFIED = 'VERIFIED',
	REJECTED = 'REJECTED',
}
registerEnumType(VerificationStatus, {
	name: 'VerificationStatus',
});

export const VerificationStatusValues = Object.values(VerificationStatus);
