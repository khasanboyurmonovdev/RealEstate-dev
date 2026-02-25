import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { ObjectId } from "mongoose";
import {
	District,
	ListingType,
	City,
	BuildingType,
	PropertyStatus,
	PropertyType,
	Renovation,
} from "../../enums/property.enum";
import { Member, TotalCounter } from "../member/member";
import { MeLiked } from "../like/like";

@ObjectType()
export class PropertyLocation {
	@Field(() => Float, { nullable: true })
	lat?: number;

	@Field(() => Float, { nullable: true })
	lng?: number;
}

@ObjectType()
export class Property {
	@Field(() => ID)
	_id: ObjectId;

	@Field(() => String)
	title: string;

	@Field(() => ListingType, { nullable: true })
	listingType?: ListingType;

	@Field(() => City, { nullable: true })
	city?: City;

	@Field(() => String, { nullable: true })
	description?: string;

	@Field(() => Int)
	price: number;

	@Field(() => String)
	currency: string;

	@Field(() => Boolean, { nullable: true })
	priceNegotiable?: boolean;

	@Field(() => Boolean, { nullable: true })
	depositRequired?: boolean;

	@Field(() => Boolean, { nullable: true })
	commissionIncluded?: boolean;

	@Field(() => PropertyLocation, { nullable: true })
	location?: PropertyLocation;

	@Field(() => PropertyType)
	propertyType: PropertyType;

	@Field(() => District)
	district: District;

	@Field(() => BuildingType, { nullable: true })
	buildingType?: BuildingType;

	@Field(() => Int)
	rooms: number;

	@Field(() => Int, { nullable: true })
	area?: number;

	@Field(() => Int, { nullable: true })
	floor?: number;

	@Field(() => Int, { nullable: true })
	totalFloors?: number;

	@Field(() => Boolean, { nullable: true })
	furnished?: boolean;

	@Field(() => Renovation, { nullable: true })
	renovation?: Renovation;

	@Field(() => Boolean, { nullable: true })
	metroNearby?: boolean;

	@Field(() => [String])
	images: string[];

	@Field(() => ID)
	owner: ObjectId;

	@Field(() => PropertyStatus)
	propertyStatus: PropertyStatus;

	@Field(() => Int)
	propertyViews: number;

	@Field(() => Int)
	propertyLikes: number;

	@Field(() => Int)
	propertyComments: number;

	@Field(() => Int)
	propertyRank: number;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date, { nullable: true })
	updatedAt?: Date;

	/** from aggregation **/
	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], {
		nullable: true,
		description: 'Requires subfield selection: { memberId likeRefId myFavorite }',
	})
	meLiked?: MeLiked[];
}

@ObjectType()
export class Properties {
	@Field(() => [Property])
	list: Property[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
