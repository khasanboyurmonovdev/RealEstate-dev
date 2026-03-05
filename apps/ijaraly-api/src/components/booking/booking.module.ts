import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BookingSchema from '../../schemas/Booking.model';
import PropertySchema from '../../schemas/Property.model';
import { BookingService } from './booking.service';
import { BookingResolver } from './booking.resolver';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Booking', schema: BookingSchema },
      { name: 'Property', schema: PropertySchema },
    ]),
    AuthModule,
    NotificationModule,
  ],
  providers: [BookingService, BookingResolver],
  exports: [BookingService],
})
export class BookingModule {}

