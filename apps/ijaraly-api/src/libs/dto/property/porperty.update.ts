import { Field, ID, InputType, Int, Float } from "@nestjs/graphql";
import { IsBoolean, IsNotEmpty, IsOptional, Length, Min } from "class-validator";
import { District, City, PropertyStatus } from "../../enums/property.enum";
import { ObjectId } from "mongoose";

import { CoordinatesInput } from "./property.input";

@InputType()
export class PropertyUpdate {
	@IsNotEmpty()
	@Field(() => ID)
	_id: ObjectId;

	@IsOptional()
	@Length(1, 200)
	@Field(() => String, { nullable: true })
	propertyTitle?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	propertyDesc?: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	propertyPrice?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	propertySquare?: number;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	propertyRent?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	propertyBarter?: boolean;

	@IsOptional()
	@Field(() => String, { nullable: true })
	listingType?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	propertyType?: string;

	@IsOptional()
	@Field(() => City, { nullable: true })
	city?: City;

	@IsOptional()
	@Field(() => District, { nullable: true })
	district?: District;

	@IsOptional()
	@Field(() => PropertyStatus, { nullable: true })
	propertyStatus?: PropertyStatus;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	images?: string[];

	@IsOptional()
	@Field(() => CoordinatesInput, { nullable: true })
	coordinates?: CoordinatesInput;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	blockedDates?: string[];

	@IsOptional()
	@Field(() => Int, { nullable: true })
	minStayNights?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	maxStayNights?: number;

	soldAt?: Date;
	deletedAt?: Date;
}
