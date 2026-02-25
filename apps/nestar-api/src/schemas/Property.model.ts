import { Schema } from 'mongoose';
import {
	PropertyTypeValues,
	DistrictValues,
	RenovationValues,
	ListingTypeValues,
	CityValues,
	BuildingTypeValues,
	PropertyStatus,
} from '../libs/enums/property.enum';

const PropertySchema = new Schema(
	{
		title: {
			type: String,
			required: true,
		},
		listingType: {
			type: String,
			enum: ListingTypeValues,
			required: true,
		},
		city: {
			type: String,
			enum: CityValues,
			required: true,
		},
		description: {
			type: String,
		},
		price: {
			type: Number,
			required: true,
		},
		currency: {
			type: String,
			default: 'UZS',
		},
		priceNegotiable: {
			type: Boolean,
			default: false,
		},
		depositRequired: {
			type: Boolean,
			default: false,
		},
		commissionIncluded: {
			type: Boolean,
			default: false,
		},
		location: {
			lat: { type: Number },
			lng: { type: Number },
		},
		propertyType: {
			type: String,
			enum: PropertyTypeValues,
			required: true,
		},
		district: {
			type: String,
			enum: DistrictValues,
			required: true,
		},
		buildingType: {
			type: String,
			enum: BuildingTypeValues,
		},
		rooms: {
			type: Number,
			min: 1,
			max: 5,
			required: true,
		},
		area: {
			type: Number,
		},
		floor: {
			type: Number,
		},
		totalFloors: {
			type: Number,
		},
		furnished: {
			type: Boolean,
			default: false,
		},
		renovation: {
			type: String,
			enum: RenovationValues,
		},
		metroNearby: {
			type: Boolean,
			default: false,
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
		// Legacy/counter fields used by views, likes, etc. (do not remove without updating other modules)
		propertyViews: { type: Number, default: 0 },
		propertyLikes: { type: Number, default: 0 },
		propertyComments: { type: Number, default: 0 },
		propertyRank: { type: Number, default: 0 },
		propertyStatus: { type: String, enum: Object.values(PropertyStatus), default: PropertyStatus.ACTIVE },
		deletedAt: { type: Date },
		soldAt: { type: Date },
	},
	{ timestamps: true, collection: 'properties' },
);

PropertySchema.index({ propertyType: 1, district: 1, title: 1, price: 1 });

export default PropertySchema;
