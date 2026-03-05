import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class AiSearchResult {
  @Field(() => [String], { nullable: true })
  districts?: string[] | null;

  @Field(() => [String], { nullable: true })
  cities?: string[] | null;

  @Field(() => String, { nullable: true })
  listingType?: string | null;

  @Field(() => String, { nullable: true })
  propertyType?: string | null;

  @Field(() => Float, { nullable: true })
  priceMin?: number | null;

  @Field(() => Float, { nullable: true })
  priceMax?: number | null;

  @Field(() => [Int], { nullable: true })
  rooms?: number[] | null;

  @Field(() => String, { nullable: true })
  text?: string | null;
}

@ObjectType()
export class AiSummaryResult {
  @Field(() => String)
  uz: string;

  @Field(() => String)
  ru: string;
}

@ObjectType()
export class FakeScoreResult {
  @Field(() => Int)
  score: number;

  @Field(() => [String])
  reasons: string[];

  @Field(() => Boolean)
  flagged: boolean;
}
