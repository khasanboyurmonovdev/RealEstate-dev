import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateBookingInput {
  @Field(() => String)
  @IsNotEmpty()
  propertyId: string;

  @Field()
  checkIn: Date;

  @Field()
  checkOut: Date;
}

@InputType()
export class BookingsInquiry {
  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  status?: string;
}

