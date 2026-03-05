import { Schema } from 'mongoose';
import {
	PaymentProviderValues,
	PaymentProvider,
	PaymentStatusValues,
	PaymentStatus,
	PaymentPurposeValues,
	PaymentPurpose,
} from '../libs/enums/payment.enum';

const PaymentSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
			index: true,
		},
		amountUZS: {
			type: Number,
			required: true,
		},
		provider: {
			type: String,
			enum: PaymentProviderValues,
			required: true,
			index: true,
		},
		status: {
			type: String,
			enum: PaymentStatusValues,
			default: PaymentStatus.PENDING,
			index: true,
		},
		transactionId: {
			type: String,
			default: null,
			index: { sparse: true },
		},
		orderId: {
			type: String,
			required: true,
			unique: true,
		},
		purpose: {
			type: String,
			enum: PaymentPurposeValues,
			required: true,
		},
		referenceId: {
			type: Schema.Types.ObjectId,
			default: null,
		},
		providerPayload: {
			type: Schema.Types.Mixed,
			default: null,
			select: false,
		},
		completedAt: {
			type: Date,
			default: null,
		},
		failedAt: {
			type: Date,
			default: null,
		},
		refundedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true, collection: 'payments' },
);

PaymentSchema.index({ memberId: 1, status: 1 });

export default PaymentSchema;
