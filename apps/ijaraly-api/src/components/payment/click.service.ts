import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { PaymentStatus, PaymentPurpose } from '../../libs/enums/payment.enum';
import { SubscriptionPlan } from '../../libs/enums/subscription.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import { BoostService } from './boost.service';

@Injectable()
export class ClickService {
	private readonly logger = new Logger(ClickService.name);

	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<any>,
		@InjectModel('Booking') private readonly bookingModel: Model<any>,
		private readonly subscriptionService: SubscriptionService,
		private readonly boostService: BoostService,
	) {}

	// Step 1: Click calls this first to verify the order exists
	public async prepare(body: any): Promise<any> {
		const {
			click_trans_id,
			service_id,
			merchant_trans_id, // this is our orderId
			amount,
			action,
			sign_time,
			sign_string,
		} = body;

		// Verify signature
		const expectedSign = this.buildSign(
			click_trans_id,
			service_id,
			process.env.CLICK_SECRET_KEY,
			merchant_trans_id,
			amount,
			action,
			sign_time,
		);

		if (expectedSign !== sign_string) {
			this.logger.warn(`Click prepare: invalid sign for order ${merchant_trans_id}`);
			return { error: -1, error_note: 'SIGN CHECK FAILED!' };
		}

		const payment = await this.paymentModel.findOne({ orderId: merchant_trans_id }).exec();

		if (!payment) {
			return { error: -5, error_note: 'User does not exist' };
		}

		if (payment.status === PaymentStatus.COMPLETED) {
			return { error: -4, error_note: 'Already paid' };
		}

		const expectedTiyin = payment.amountUZS;
		if (Math.abs(parseFloat(amount) - expectedTiyin) > 0.01) {
			return { error: -2, error_note: 'Incorrect parameter amount' };
		}

		return {
			click_trans_id,
			merchant_trans_id,
			merchant_prepare_id: payment._id.toString(),
			error: 0,
			error_note: 'Success',
		};
	}

	// Step 2: Click calls this to confirm the payment
	public async complete(body: any): Promise<any> {
		const {
			click_trans_id,
			service_id,
			merchant_trans_id,
			merchant_prepare_id,
			amount,
			action,
			sign_time,
			sign_string,
			error: clickError,
		} = body;

		// Verify signature
		const expectedSign = this.buildSign(
			click_trans_id,
			service_id,
			process.env.CLICK_SECRET_KEY,
			merchant_trans_id,
			amount,
			action,
			sign_time,
			merchant_prepare_id,
		);

		if (expectedSign !== sign_string) {
			this.logger.warn(`Click complete: invalid sign for order ${merchant_trans_id}`);
			return { error: -1, error_note: 'SIGN CHECK FAILED!' };
		}

		const payment = await this.paymentModel.findOne({ orderId: merchant_trans_id }).exec();

		if (!payment) {
			return { error: -5, error_note: 'User does not exist' };
		}

		if (payment.status === PaymentStatus.COMPLETED) {
			return { error: -4, error_note: 'Already paid' };
		}

		// Click signals a user cancellation or error
		if (clickError && parseInt(clickError) < 0) {
			payment.status = PaymentStatus.FAILED;
			payment.failedAt = new Date();
			payment.providerPayload = body;
			await payment.save();
			return { error: 0, error_note: 'Success' };
		}

		const now = new Date();
		payment.status = PaymentStatus.COMPLETED;
		payment.completedAt = now;
		payment.transactionId = click_trans_id?.toString() ?? null;
		payment.providerPayload = body;
		await payment.save();

		// Post-payment actions
		await this.onPaymentCompleted(payment);

		return {
			click_trans_id,
			merchant_trans_id,
			merchant_confirm_id: payment._id.toString(),
			error: 0,
			error_note: 'Success',
		};
	}

	private async onPaymentCompleted(payment: any): Promise<void> {
		try {
			if (payment.purpose === PaymentPurpose.SUBSCRIPTION && payment.referenceId === null) {
				const plan = payment.amountUZS === 99_000
					? SubscriptionPlan.BASIC
					: SubscriptionPlan.PRO;
				await this.subscriptionService.activateSubscription(
					payment.memberId.toString(),
					plan,
				);
			}

			if (payment.purpose === PaymentPurpose.BOOKING && payment.referenceId) {
				await this.bookingModel.findByIdAndUpdate(payment.referenceId, {
					$set: { paymentId: payment._id },
				}).exec();
			}

			if (payment.purpose === PaymentPurpose.BOOST && payment.referenceId) {
				await this.boostService.activateBoost(payment);
			}
		} catch (err) {
			this.logger.error(`Click onPaymentCompleted error: ${err.message}`);
		}
	}

	private buildSign(
		clickTransId: any,
		serviceId: any,
		secretKey: string,
		merchantTransId: any,
		amount: any,
		action: any,
		signTime: any,
		merchantPrepareId?: any,
	): string {
		const prepareId = merchantPrepareId !== undefined ? merchantPrepareId : '';
		const raw = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${prepareId}${amount}${action}${signTime}`;
		return crypto.createHash('md5').update(raw).digest('hex');
	}
}
