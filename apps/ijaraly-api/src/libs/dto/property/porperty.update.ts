import { Field, ID, InputType, Int } from "@nestjs/graphql";
import { IsBoolean, IsNotEmpty, IsOptional, Length, Min } from "class-validator";
import { District, City, PropertyStatus } from "../../enums/property.enum";
import { ObjectId } from "mongoose";

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

	soldAt?: Date;
	deletedAt?: Date;
}
