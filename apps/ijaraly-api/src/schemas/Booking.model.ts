import { Schema } from 'mongoose';
import { BookingStatusValues, BookingStatus } from '../libs/enums/booking.enum';

const BookingSchema = new Schema(
  {
    propertyId:    { type: Schema.Types.ObjectId, required: true, ref: 'Property', index: true },
    guestId:       { type: Schema.Types.ObjectId, required: true, ref: 'Member', index: true },
    ownerId:       { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
    checkIn:       { type: Date, required: true },
    checkOut:      { type: Date, required: true },
    nights:        { type: Number, required: true },
    totalPriceUZS: { type: Number, required: true },
    status:        { type: String, enum: BookingStatusValues, default: BookingStatus.PENDING, index: true },
    paymentId:     { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
    cancelledAt:   { type: Date, default: null },
    cancelReason:  { type: String, default: null },
  },
  { timestamps: true, collection: 'bookings' },
);

// Prevent double-booking: one active booking per property per date range (handled in service logic)
BookingSchema.index({ propertyId: 1, checkIn: 1, checkOut: 1 });

export default BookingSchema;

