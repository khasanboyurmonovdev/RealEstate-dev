import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class Booking {
  @Field(() => ID)
  _id: string;

  @Field(() => String)
  propertyId: string;

  @Field(() => String)
  guestId: string;

  @Field(() => String)
  ownerId: string;

  @Field()
  checkIn: Date;

  @Field()
  checkOut: Date;

  @Field(() => Int)
  nights: number;

  @Field(() => Int)
  totalPriceUZS: number;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  cancelReason?: string;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class BookingsResponse {
  @Field(() => [Booking])
  list: Booking[];

  @Field(() => Int)
  totalCount: number;
}

