import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Booking, BookingsResponse } from '../../libs/dto/booking/booking';
import { CreateBookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingService } from './booking.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Member } from '../../libs/dto/member/member';

@Resolver()
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Booking)
  public async createBooking(
    @Args('input') input: CreateBookingInput,
    @AuthMember() authMember: Member,
  ): Promise<Booking> {
    return await this.bookingService.createBooking(input, authMember);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Booking)
  public async confirmBooking(
    @Args('bookingId') bookingId: string,
    @AuthMember() authMember: Member,
  ): Promise<Booking> {
    return await this.bookingService.confirmBooking(bookingId, authMember);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Booking)
  public async cancelBooking(
    @Args('bookingId') bookingId: string,
    @Args('reason') reason: string,
    @AuthMember() authMember: Member,
  ): Promise<Booking> {
    return await this.bookingService.cancelBooking(bookingId, reason, authMember);
  }

  @UseGuards(AuthGuard)
  @Query(() => BookingsResponse)
  public async getMyBookings(
    @Args('input') input: BookingsInquiry,
    @AuthMember() authMember: Member,
  ): Promise<BookingsResponse> {
    const { list, totalCount } = await this.bookingService.getMyBookings(input, authMember);
    return { list, totalCount };
  }

  @UseGuards(AuthGuard)
  @Query(() => [Booking])
  public async getPropertyBookings(
    @Args('propertyId') propertyId: string,
    @AuthMember() authMember: Member,
  ): Promise<Booking[]> {
    return await this.bookingService.getPropertyBookings(propertyId, authMember);
  }
}

