import { Schema } from 'mongoose';
import {
	DistrictValues,
	CityValues,
	ListingTypeValues,
	ListingType,
	PropertyTypeValues,
	PropertyType,
	PropertyStatus,
} from '../libs/enums/property.enum';
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
		listingType: {
			type: String,
			enum: ListingTypeValues,
			default: ListingType.LONG_RENT,
			index: true,
		},
		propertyType: {
			type: String,
			enum: PropertyTypeValues,
			default: PropertyType.APARTMENT,
			index: true,
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
		location: {
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point',
			},
			coordinates: {
				type: [Number],
				default: [69.2401, 41.2995], // [lng, lat] Tashkent center
			},
		},
		blockedDates: { type: [Date], default: [] },
		minStayNights: { type: Number, default: 1 },
		maxStayNights: { type: Number, default: 30 },
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
		boostedUntil: {
			type: Date,
			default: null,
			index: true,
		},
	},
	{ timestamps: true, collection: 'properties' },
);

PropertySchema.index({ district: 1, propertyTitle: 1, propertyPrice: 1 });
PropertySchema.index({ location: '2dsphere' });

export default PropertySchema;
