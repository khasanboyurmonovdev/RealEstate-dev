import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Booking } from '../../libs/dto/booking/booking';
import { CreateBookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { Member } from '../../libs/dto/member/member';
import { Property } from '../../libs/dto/property/property';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { ListingType, PropertyStatus } from '../../libs/enums/property.enum';
import { VerificationStatus } from '../../libs/enums/verification.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel('Booking') private readonly bookingModel: Model<Booking>,
    @InjectModel('Property') private readonly propertyModel: Model<Property>,
  ) {}

  public async createBooking(input: CreateBookingInput, authMember: Member): Promise<Booking> {
    const property = await this.propertyModel.findById(input.propertyId).exec();
    if (!property) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (property.listingType !== ListingType.SHORT_STAY) {
      throw new BadRequestException('ONLY_SHORT_STAY_ALLOWED');
    }

    if (
      property.propertyStatus !== PropertyStatus.ACTIVE ||
      property.verificationStatus !== VerificationStatus.VERIFIED
    ) {
      throw new BadRequestException('PROPERTY_NOT_BOOKABLE');
    }

    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);

    if (!(checkIn instanceof Date) || isNaN(checkIn.getTime()) || !(checkOut instanceof Date) || isNaN(checkOut.getTime())) {
      throw new BadRequestException('INVALID_DATES');
    }

    const ms = checkOut.getTime() - checkIn.getTime();
    const nights = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (nights < 1) throw new BadRequestException('INVALID_STAY_LENGTH');

    const minStay = property['minStayNights'] ?? 1;
    const maxStay = property['maxStayNights'] ?? 30;
    if (nights < minStay || nights > maxStay) {
      throw new BadRequestException('STAY_LENGTH_NOT_ALLOWED');
    }

    // Check blockedDates overlap
    const requestedDateKeys = this.buildDateKeysRange(checkIn, checkOut);
    const blockedKeys: Set<string> = new Set(
      (property.blockedDates ?? []).map((d: string) => this.dateKey(new Date(d))),
    );
    const hasBlockedOverlap = requestedDateKeys.some((k) => blockedKeys.has(k));
    if (hasBlockedOverlap) {
      throw new BadRequestException('DATES_BLOCKED');
    }

    // Check overlapping bookings (PENDING or CONFIRMED)
    const overlapping = await this.bookingModel.findOne({
      propertyId: property._id,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    }).exec();

    if (overlapping) {
      throw new BadRequestException('ALREADY_BOOKED_FOR_DATES');
    }

    const totalPriceUZS = property.propertyPrice * nights;

    const booking = await this.bookingModel.create({
      propertyId: property._id,
      guestId: authMember._id,
      ownerId: property.owner,
      checkIn,
      checkOut,
      nights,
      totalPriceUZS,
      status: BookingStatus.PENDING,
    });

    // Add booked dates to blockedDates
    const newBlockedDates: string[] = [ ...(property.blockedDates ?? []) ];
    requestedDateKeys.forEach((key) => {
      if (!blockedKeys.has(key)) {
        newBlockedDates.push(key);
      }
    });
    (property as any).blockedDates = newBlockedDates;
    await property.save();

    return booking;
  }

  public async confirmBooking(bookingId: string, authMember: Member): Promise<Booking> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (booking.ownerId.toString() !== authMember._id.toString()) {
      throw new ForbiddenException('NOT_OWNER');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('BOOKING_NOT_PENDING');
    }

    booking.status = BookingStatus.CONFIRMED;
    await booking.save();

    return booking;
  }

  public async cancelBooking(
    bookingId: string,
    reason: string,
    authMember: Member,
  ): Promise<Booking> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const isGuest = booking.guestId.toString() === authMember._id.toString();
    const isOwner = booking.ownerId.toString() === authMember._id.toString();
    if (!isGuest && !isOwner) {
      throw new ForbiddenException('NOT_ALLOWED');
    }

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException('BOOKING_NOT_CANCELLABLE');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelReason = reason;
    await booking.save();

    // Remove cancelled dates from property's blockedDates
    const property = await this.propertyModel.findById(booking.propertyId).exec();
    if (property) {
      const cancelKeys = this.buildDateKeysRange(booking.checkIn, booking.checkOut);
      const cancelSet = new Set(cancelKeys);
      const newBlocked = (property.blockedDates ?? []).filter(
        (d: string) => !cancelSet.has(this.dateKey(new Date(d))),
      );
      (property as any).blockedDates = newBlocked;
      await property.save();
    }

    return booking;
  }

  public async getMyBookings(
    input: BookingsInquiry,
    authMember: Member,
  ): Promise<{ list: Booking[]; totalCount: number }> {
    const { page, limit, status } = input;
    const filter: any = {
      guestId: authMember._id,
    };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [list, totalCount] = await Promise.all([
      this.bookingModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return { list, totalCount };
  }

  public async getPropertyBookings(
    propertyId: string,
    authMember: Member,
  ): Promise<Booking[]> {
    const property = await this.propertyModel.findById(propertyId).exec();
    if (!property) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (property.owner.toString() !== authMember._id.toString()) {
      throw new ForbiddenException('NOT_OWNER');
    }

    return await this.bookingModel
      .find({
        propertyId: property._id,
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      })
      .sort({ checkIn: 1 })
      .exec();
  }

  private dateKey(d: Date): string {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildDateKeysRange(start: Date, end: Date): string[] {
    const keys: string[] = [];
    const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    while (current < endUTC) {
      keys.push(this.dateKey(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return keys;
  }
}

