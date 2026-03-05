import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentStatus, PaymentPurpose } from '../../libs/enums/payment.enum';
import { SubscriptionPlan } from '../../libs/enums/subscription.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import { BoostService } from './boost.service';

// Payme error codes
const PaymeError = {
	PARSE_ERROR: { code: -32700, message: { ru: 'Could not parse JSON', uz: 'JSON parse xatosi', en: 'Could not parse JSON' } },
	METHOD_NOT_FOUND: { code: -32601, message: { ru: 'Method not found', uz: 'Metod topilmadi', en: 'Method not found' } },
	INVALID_AMOUNT: { code: -31001, message: { ru: 'Неверная сумма', uz: 'Noto\'g\'ri summa', en: 'Invalid amount' } },
	ORDER_NOT_FOUND: { code: -31050, message: { ru: 'Заказ не найден', uz: 'Buyurtma topilmadi', en: 'Order not found' } },
	ORDER_ALREADY_PAID: { code: -31051, message: { ru: 'Уже оплачен', uz: 'Allaqachon to\'langan', en: 'Already paid' } },
	TRANSACTION_NOT_FOUND: { code: -31003, message: { ru: 'Транзакция не найдена', uz: 'Tranzaksiya topilmadi', en: 'Transaction not found' } },
	UNABLE_TO_CANCEL: { code: -31007, message: { ru: 'Невозможно отменить', uz: 'Bekor qilib bo\'lmaydi', en: 'Unable to cancel' } },
};

@Injectable()
export class PaymeService {
	private readonly logger = new Logger(PaymeService.name);

	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		@InjectModel('Booking') private readonly bookingModel: Model<any>,
		private readonly subscriptionService: SubscriptionService,
		private readonly boostService: BoostService,
	) {}

	public async handleRpc(method: string, params: any, rpcId: any): Promise<any> {
		this.logger.log(`Payme RPC: ${method}`);

		try {
			switch (method) {
				case 'CheckPerformTransaction':
					return this.checkPerformTransaction(params, rpcId);
				case 'CreateTransaction':
					return this.createTransaction(params, rpcId);
				case 'PerformTransaction':
					return this.performTransaction(params, rpcId);
				case 'CancelTransaction':
					return this.cancelTransaction(params, rpcId);
				case 'CheckTransaction':
					return this.checkTransaction(params, rpcId);
				case 'GetStatement':
					return this.getStatement(params, rpcId);
				default:
					return this.errorResponse(PaymeError.METHOD_NOT_FOUND, rpcId);
			}
		} catch (err) {
			this.logger.error(`Payme RPC error: ${err.message}`);
			return this.errorResponse({ code: -32603, message: { ru: err.message, uz: err.message, en: err.message } }, rpcId);
		}
	}

	private async checkPerformTransaction(params: any, rpcId: any) {
		const orderId = params?.account?.order_id;
		if (!orderId) return this.errorResponse(PaymeError.ORDER_NOT_FOUND, rpcId);

		const payment = await this.paymentModel.findOne({ orderId }).exec();
		if (!payment) return this.errorResponse(PaymeError.ORDER_NOT_FOUND, rpcId);

		if (payment.status === PaymentStatus.COMPLETED) {
			return this.errorResponse(PaymeError.ORDER_ALREADY_PAID, rpcId);
		}

		const expectedTiyin = payment.amountUZS * 100;
		if (params.amount !== expectedTiyin) {
			return this.errorResponse(PaymeError.INVALID_AMOUNT, rpcId);
		}

		return { result: { allow: true }, id: rpcId };
	}

	private async createTransaction(params: any, rpcId: any) {
		const orderId = params?.account?.order_id;
		if (!orderId) return this.errorResponse(PaymeError.ORDER_NOT_FOUND, rpcId);

		const payment = await this.paymentModel.findOne({ orderId }).exec();
		if (!payment) return this.errorResponse(PaymeError.ORDER_NOT_FOUND, rpcId);

		if (payment.status === PaymentStatus.COMPLETED) {
			return this.errorResponse(PaymeError.ORDER_ALREADY_PAID, rpcId);
		}

		// If transaction already created by Payme, return existing
		if (payment.transactionId === params.id) {
			return {
				result: {
					create_time: new Date(payment.createdAt).getTime(),
					transaction: payment._id.toString(),
					state: 1,
				},
				id: rpcId,
			};
		}

		const expectedTiyin = payment.amountUZS * 100;
		if (params.amount !== expectedTiyin) {
			return this.errorResponse(PaymeError.INVALID_AMOUNT, rpcId);
		}

		payment.transactionId = params.id;
		await payment.save();

		return {
			result: {
				create_time: new Date(payment.createdAt).getTime(),
				transaction: payment._id.toString(),
				state: 1,
			},
			id: rpcId,
		};
	}

	private async performTransaction(params: any, rpcId: any) {
		const payment = await this.paymentModel.findOne({ transactionId: params.id }).exec();
		if (!payment) return this.errorResponse(PaymeError.TRANSACTION_NOT_FOUND, rpcId);

		if (payment.status === PaymentStatus.COMPLETED) {
			return {
				result: {
					transaction: payment._id.toString(),
					perform_time: new Date(payment.completedAt).getTime(),
					state: 2,
				},
				id: rpcId,
			};
		}

		const now = new Date();
		payment.status = PaymentStatus.COMPLETED;
		payment.completedAt = now;
		await payment.save();

		// Post-payment actions
		await this.onPaymentCompleted(payment);

		return {
			result: {
				transaction: payment._id.toString(),
				perform_time: now.getTime(),
				state: 2,
			},
			id: rpcId,
		};
	}

	private async cancelTransaction(params: any, rpcId: any) {
		const payment = await this.paymentModel.findOne({ transactionId: params.id }).exec();
		if (!payment) return this.errorResponse(PaymeError.TRANSACTION_NOT_FOUND, rpcId);

		if (payment.status === PaymentStatus.COMPLETED) {
			return this.errorResponse(PaymeError.UNABLE_TO_CANCEL, rpcId);
		}

		const now = new Date();
		payment.status = PaymentStatus.FAILED;
		payment.failedAt = now;
		await payment.save();

		return {
			result: {
				transaction: payment._id.toString(),
				cancel_time: now.getTime(),
				state: -1,
			},
			id: rpcId,
		};
	}

	private async checkTransaction(params: any, rpcId: any) {
		const payment = await this.paymentModel.findOne({ transactionId: params.id }).exec();
		if (!payment) return this.errorResponse(PaymeError.TRANSACTION_NOT_FOUND, rpcId);

		const stateMap: Record<string, number> = {
			[PaymentStatus.PENDING]: 1,
			[PaymentStatus.COMPLETED]: 2,
			[PaymentStatus.FAILED]: -1,
			[PaymentStatus.REFUNDED]: -2,
		};

		return {
			result: {
				create_time: new Date(payment.createdAt).getTime(),
				perform_time: payment.completedAt ? new Date(payment.completedAt).getTime() : 0,
				cancel_time: payment.failedAt ? new Date(payment.failedAt).getTime() : 0,
				transaction: payment._id.toString(),
				state: stateMap[payment.status] ?? 1,
				reason: null,
			},
			id: rpcId,
		};
	}

	private async getStatement(params: any, rpcId: any) {
		const from = new Date(params.from);
		const to = new Date(params.to);

		const payments = await this.paymentModel.find({
			status: PaymentStatus.COMPLETED,
			completedAt: { $gte: from, $lte: to },
		}).exec();

		const transactions = payments.map((p: any) => ({
			id: p.transactionId,
			time: new Date(p.createdAt).getTime(),
			amount: p.amountUZS * 100,
			account: { order_id: p.orderId },
			create_time: new Date(p.createdAt).getTime(),
			perform_time: p.completedAt ? new Date(p.completedAt).getTime() : 0,
			cancel_time: 0,
			transaction: p._id.toString(),
			state: 2,
			reason: null,
		}));

		return { result: { transactions }, id: rpcId };
	}

	private async onPaymentCompleted(payment: any): Promise<void> {
		try {
			if (payment.purpose === PaymentPurpose.SUBSCRIPTION && payment.referenceId === null) {
				// Determine plan from amount
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
			this.logger.error(`onPaymentCompleted error: ${err.message}`);
		}
	}

	private errorResponse(error: { code: number; message: any }, rpcId: any) {
		return { error: { code: error.code, message: error.message, data: null }, id: rpcId };
	}
}
