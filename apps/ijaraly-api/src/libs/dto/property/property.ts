import { Field, ID, Int, ObjectType, Float } from "@nestjs/graphql";
import { ObjectId } from "mongoose";
import { District, City, PropertyStatus } from "../../enums/property.enum";
import { VerificationStatus } from "../../enums/verification.enum";
import { Member, TotalCounter } from "../member/member";
import { MeLiked } from "../like/like";

@ObjectType()
export class PropertyCoordinates {
	@Field(() => String)
	type: string;

	@Field(() => [Float])
	coordinates: number[];
}

@ObjectType()
export class CoordinatesOutput {
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
	propertyTitle: string;

	@Field(() => Int)
	propertyPrice: number;

	@Field(() => String, { nullable: true })
	propertyDesc?: string;

	@Field(() => Int, { nullable: true })
	propertySquare?: number;

	@Field(() => Boolean, { nullable: true })
	propertyRent?: boolean;

	@Field(() => Boolean, { nullable: true })
	propertyBarter?: boolean;

	@Field(() => String, { nullable: true })
	listingType?: string;

	@Field(() => String, { nullable: true })
	propertyType?: string;

	@Field(() => CoordinatesOutput, { nullable: true })
	coordinates?: CoordinatesOutput;

	@Field(() => PropertyCoordinates, { nullable: true })
	location?: PropertyCoordinates;

	@Field(() => [String], { nullable: true })
	blockedDates?: string[];

	@Field(() => Int, { nullable: true })
	minStayNights?: number;

	@Field(() => Int, { nullable: true })
	maxStayNights?: number;

	@Field(() => City, { nullable: true })
	city?: City;

	@Field(() => District)
	district: District;

	@Field(() => String, { nullable: true })
	propertyAddress?: string;

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

	@Field(() => VerificationStatus, { nullable: true })
	verificationStatus?: VerificationStatus;

	@Field(() => String, { nullable: true })
	rejectionReason?: string;

	@Field(() => Date, { nullable: true })
	verifiedAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date, { nullable: true })
	updatedAt?: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Boolean, { nullable: true })
	isDuplicateWarning?: boolean;

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
