import { Schema } from 'mongoose';
import { DistrictValues, CityValues, PropertyStatus } from '../libs/enums/property.enum';
import { VerificationStatus } from '../libs/enums/verification.enum';

const PropertySchema = new Schema(
	{
		propertyTitle: {
			type: String,
			required: true,
		},
		propertyPrice: {
			type: Number,
			required: true,
		},
		currency: {
			type: String,
			default: 'UZS',
		},
		propertyDesc: {
			type: String,
		},
		propertySquare: {
			type: Number,
		},
		propertyRent: {
			type: Boolean,
			default: false,
		},
		propertyBarter: {
			type: Boolean,
			default: false,
		},
		city: {
			type: String,
			enum: CityValues,
			required: true,
		},
		district: {
			type: String,
			enum: DistrictValues,
			required: true,
		},
		propertyAddress: {
			type: String,
		},
		images: {
			type: [String],
			default: [],
		},
		owner: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},
		propertyViews: { type: Number, default: 0 },
		propertyLikes: { type: Number, default: 0 },
		propertyComments: { type: Number, default: 0 },
		propertyRank: { type: Number, default: 0 },
		propertyStatus: { type: String, enum: Object.values(PropertyStatus), default: PropertyStatus.ACTIVE },
		verificationStatus: {
			type: String,
			enum: Object.values(VerificationStatus),
			default: VerificationStatus.PENDING,
			index: true,
		},
		rejectionReason: { type: String, default: null },
		verifiedAt: { type: Date, default: null },
		deletedAt: { type: Date },
		soldAt: { type: Date },
	},
	{ timestamps: true, collection: 'properties' },
);

PropertySchema.index({ district: 1, propertyTitle: 1, propertyPrice: 1 });

export default PropertySchema;
