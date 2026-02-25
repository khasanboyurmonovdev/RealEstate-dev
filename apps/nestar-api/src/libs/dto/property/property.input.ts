import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min, Max } from 'class-validator';
import {
	District,
	ListingType,
	City,
	BuildingType,
	PropertyStatus,
	PropertyType,
	Renovation,
} from '../../enums/property.enum';
import { ObjectId } from 'mongoose';
import { availablePropertySorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class LocationInput {
	@IsOptional()
	@Field(() => Float, { nullable: true })
	lat?: number;

	@IsOptional()
	@Field(() => Float, { nullable: true })
	lng?: number;
}

@InputType()
export class PropertyInput {
	@IsNotEmpty()
	@Length(5, 200)
	@Field(() => String)
	title: string;

	@IsNotEmpty()
	@Field(() => ListingType)
	listingType: ListingType;

	@IsNotEmpty()
	@Field(() => City)
	city: City;

	@IsOptional()
	@Field(() => String, { nullable: true })
	description?: string;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Int)
	price: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	currency?: string;

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

	owner: ObjectId;
	@Field(() => LocationInput, { nullable: true })
	location?: LocationInput;

	@IsNotEmpty()
	@Field(() => PropertyType)
	propertyType: PropertyType;

	@IsNotEmpty()
	@Field(() => District)
	district: District;

	@IsOptional()
	@Field(() => BuildingType, { nullable: true })
	buildingType?: BuildingType;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(5)
	@Field(() => Int)
	rooms: number;

	@IsOptional()
	@Min(0)
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
}

@InputType()
export class AreaRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
export class PISearch {
	@IsOptional()
	@Field(() => ID, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => District, { nullable: true })
	district?: District;

	@IsOptional()
	@Field(() => [District], { nullable: true })
	districtList?: District[];

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	minPrice?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	maxPrice?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	rooms?: number;

	@IsOptional()
	@Field(() => [Int], { nullable: true })
	roomsList?: number[];

	@IsOptional()
	@Field(() => PropertyType, { nullable: true })
	propertyType?: PropertyType;

	@IsOptional()
	@Field(() => [PropertyType], { nullable: true })
	propertyTypeList?: PropertyType[];

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
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => AreaRange, { nullable: true })
	areaRange?: AreaRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class PropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
export class APISearch {
	@IsOptional()
	@Field(() => PropertyStatus, { nullable: true })
	propertyStatus?: PropertyStatus;
}

@InputType()
export class AgentPropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => APISearch)
	search: APISearch;
}

@InputType()
export class ALPISearch {
	@IsOptional()
	@Field(() => PropertyStatus, { nullable: true })
	propertyStatus?: PropertyStatus;

	@IsOptional()
	@Field(() => [District], { nullable: true })
	districtList?: District[];
}

@InputType()
export class AllPropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
