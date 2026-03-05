import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '../../libs/dto/member/member';
import { InitiatePaymentInput, } from '../../libs/dto/payment/payment.input';
import { InitiatePaymentResult, PaymentRecord } from '../../libs/dto/payment/payment';
import { PaymentProvider, PaymentPurpose, PaymentStatus } from '../../libs/enums/payment.enum';
import { SubscriptionPlan, SUBSCRIPTION_PRICES_UZS } from '../../libs/enums/subscription.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class PaymentService {
	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<any>,
		@InjectModel('Booking') private readonly bookingModel: Model<any>,
	) {}

	public async initiatePayment(
		input: InitiatePaymentInput,
		authMember: Member,
	): Promise<InitiatePaymentResult> {
		let amountUZS: number;
		let referenceId: string | null = null;

		if (input.purpose === PaymentPurpose.BOOKING) {
			if (!input.bookingId) throw new BadRequestException('BOOKING_ID_REQUIRED');
			const booking = await this.bookingModel.findById(input.bookingId).exec();
			if (!booking) throw new BadRequestException(Message.NO_DATA_FOUND);
			if (booking.guestId.toString() !== (authMember._id as any).toString()) {
				throw new BadRequestException('NOT_YOUR_BOOKING');
			}
			amountUZS = booking.totalPriceUZS;
			referenceId = booking._id.toString();
		} else if (input.purpose === PaymentPurpose.SUBSCRIPTION) {
			if (!input.subscriptionPlan || input.subscriptionPlan === SubscriptionPlan.FREE) {
				throw new BadRequestException('INVALID_SUBSCRIPTION_PLAN');
			}
			amountUZS = SUBSCRIPTION_PRICES_UZS[input.subscriptionPlan];
			referenceId = null;
		} else {
			throw new BadRequestException('UNSUPPORTED_PURPOSE_USE_BOOST_ENDPOINT');
		}

		const orderId = uuidv4();

		await this.paymentModel.create({
			memberId: authMember._id,
			amountUZS,
			provider: input.provider,
			status: PaymentStatus.PENDING,
			orderId,
			purpose: input.purpose,
			referenceId,
		});

		const redirectUrl = input.provider === PaymentProvider.PAYME
			? this.buildPaymeUrl(orderId, amountUZS)
			: this.buildClickUrl(orderId, amountUZS);

		return { orderId, redirectUrl, amountUZS };
	}

	public async getMyPayments(authMember: Member): Promise<PaymentRecord[]> {
		return this.paymentModel
			.find({ memberId: authMember._id })
			.sort({ createdAt: -1 })
			.limit(50)
			.exec();
	}

	private buildPaymeUrl(orderId: string, amountUZS: number): string {
		const merchantId = process.env.PAYME_MERCHANT_ID;
		const amountTiyin = amountUZS * 100;
		const params = `m=${merchantId};ac.order_id=${orderId};a=${amountTiyin}`;
		const encoded = Buffer.from(params).toString('base64');
		const baseUrl = process.env.PAYME_TEST_MODE === 'true'
			? 'https://checkout.test.paycom.uz'
			: 'https://checkout.paycom.uz';
		return `${baseUrl}/${encoded}`;
	}

	private buildClickUrl(orderId: string, amountUZS: number): string {
		const serviceId = process.env.CLICK_SERVICE_ID;
		const merchantId = process.env.CLICK_MERCHANT_ID;
		const returnUrl = `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`;
		return `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amountUZS}&transaction_param=${orderId}&return_url=${encodeURIComponent(returnUrl)}`;
	}
}
