export enum PaymentProvider {
	PAYME = 'PAYME',
	CLICK = 'CLICK',
}

export const PaymentProviderValues = Object.values(PaymentProvider);

export enum PaymentStatus {
	PENDING = 'PENDING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	REFUNDED = 'REFUNDED',
}

export const PaymentStatusValues = Object.values(PaymentStatus);

export enum PaymentPurpose {
	BOOKING = 'BOOKING',
	SUBSCRIPTION = 'SUBSCRIPTION',
	BOOST = 'BOOST',
}

export const PaymentPurposeValues = Object.values(PaymentPurpose);
