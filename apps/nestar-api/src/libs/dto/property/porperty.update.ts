import { Field, Float, ID, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsNotEmpty, IsOptional, Length, Min, Max } from "class-validator";
import {
	District,
	ListingType,
	City,
	BuildingType,
	PropertyStatus,
	PropertyType,
	Renovation,
} from "../../enums/property.enum";
import { ObjectId } from "mongoose";

@InputType()
export class LocationUpdateInput {
	@IsOptional()
	@Field(() => Float, { nullable: true })
	lat?: number;

	@IsOptional()
	@Field(() => Float, { nullable: true })
	lng?: number;
}

@InputType()
export class PropertyUpdate {
	@IsNotEmpty()
	@Field(() => ID)
	_id: ObjectId;

	@IsOptional()
	@Length(5, 200)
	@Field(() => String, { nullable: true })
	title?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	description?: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	price?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	currency?: string;

	@IsOptional()
	@Field(() => ListingType, { nullable: true })
	listingType?: ListingType;

	@IsOptional()
	@Field(() => City, { nullable: true })
	city?: City;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	priceNegotiable?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	depositRequired?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	commissionIncluded?: boolean;

	@IsOptional()
	@Field(() => LocationUpdateInput, { nullable: true })
	location?: LocationUpdateInput;

	@IsOptional()
	@Field(() => PropertyType, { nullable: true })
	propertyType?: PropertyType;

	@IsOptional()
	@Field(() => District, { nullable: true })
	district?: District;

	@IsOptional()
	@Field(() => BuildingType, { nullable: true })
	buildingType?: BuildingType;

	@IsOptional()
	@Field(() => PropertyStatus, { nullable: true })
	propertyStatus?: PropertyStatus;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(5)
	@Field(() => Int, { nullable: true })
	rooms?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	area?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	floor?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	totalFloors?: number;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	furnished?: boolean;

	@IsOptional()
	@Field(() => Renovation, { nullable: true })
	renovation?: Renovation;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	metroNearby?: boolean;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	images?: string[];

	soldAt?: Date;
	deletedAt?: Date;
}
