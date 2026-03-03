import { Schema } from 'mongoose';

const OtpSchema = new Schema(
	{
		otpPhone: {
			type: String,
			required: true,
			index: true,
		},
		otpCode: {
			type: String,
			required: true,
		},
		otpExpiresAt: {
			type: Date,
			required: true,
		},
		otpAttempts: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'otps' },
);

OtpSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default OtpSchema;
