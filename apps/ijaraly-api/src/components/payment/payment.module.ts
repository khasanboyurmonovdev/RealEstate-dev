import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { PaymeService } from './payme.service';
import { PaymeController } from './payme.controller';
import { ClickService } from './click.service';
import { ClickController } from './click.controller';
import { BoostService } from './boost.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import PaymentSchema from '../../schemas/Payment.model';
import MemberSchema from '../../schemas/Member.model';
import BookingSchema from '../../schemas/Booking.model';
import PropertySchema from '../../schemas/Property.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Payment', schema: PaymentSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Booking', schema: BookingSchema },
			{ name: 'Property', schema: PropertySchema },
		]),
		SubscriptionModule,
		AuthModule,
	],
	controllers: [PaymeController, ClickController],
	providers: [PaymentService, PaymentResolver, PaymeService, ClickService, BoostService],
	exports: [PaymentService],
})
export class PaymentModule {}
