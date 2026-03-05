import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { PaymentProvider, PaymentPurpose, PaymentStatus } from '../../libs/enums/payment.enum';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { Message } from '../../libs/enums/common.enum';
import { Member } from '../../libs/dto/member/member';

export const BOOST_DURATIONS_DAYS: Record<number, number> = {
	7: 49_000,
	14: 89_000,
	30: 149_000,
};

@Injectable()
export class BoostService {
	private readonly logger = new Logger(BoostService.name);

	constructor(
		@InjectModel('Payment') private readonly paymentModel: Model<any>,
		@InjectModel('Property') private readonly propertyModel: Model<any>,
	) {}

	public async initiateBoost(
		propertyId: string,
		days: number,
		provider: PaymentProvider,
		authMember: Member,
	): Promise<{ orderId: string; redirectUrl: string; amountUZS: number }> {
		const amountUZS = BOOST_DURATIONS_DAYS[days];
		if (!amountUZS) {
			throw new BadRequestException('INVALID_BOOST_DURATION: choose 7, 14, or 30 days');
		}

		const property = await this.propertyModel.findById(propertyId).exec();
		if (!property) throw new BadRequestException(Message.NO_DATA_FOUND);

		if (property.owner.toString() !== (authMember._id as any).toString()) {
			throw new BadRequestException('NOT_YOUR_PROPERTY');
		}

		if (property.propertyStatus !== PropertyStatus.ACTIVE) {
			throw new BadRequestException('PROPERTY_NOT_ACTIVE');
		}

		const orderId = uuidv4();

		await this.paymentModel.create({
			memberId: authMember._id,
			amountUZS,
			provider,
			status: PaymentStatus.PENDING,
			orderId,
			purpose: PaymentPurpose.BOOST,
			referenceId: property._id,
		});

		const redirectUrl = provider === PaymentProvider.PAYME
			? this.buildPaymeUrl(orderId, amountUZS)
			: this.buildClickUrl(orderId, amountUZS);

		return { orderId, redirectUrl, amountUZS };
	}

	public async activateBoost(payment: any): Promise<void> {
		if (payment.purpose !== PaymentPurpose.BOOST || !payment.referenceId) return;

		// Determine days from amount paid
		const daysEntry = Object.entries(BOOST_DURATIONS_DAYS).find(
			([, price]) => price === payment.amountUZS,
		);
		if (!daysEntry) {
			this.logger.warn(`Could not determine boost duration for amount ${payment.amountUZS}`);
			return;
		}
		const days = parseInt(daysEntry[0]);

		const property = await this.propertyModel.findById(payment.referenceId).exec();
		if (!property) return;

		const now = new Date();
		// If already boosted and not expired, extend from current boostedUntil
		const base = property.boostedUntil && property.boostedUntil > now
			? property.boostedUntil
			: now;

		const boostedUntil = new Date(base);
		boostedUntil.setDate(boostedUntil.getDate() + days);

		await this.propertyModel.findByIdAndUpdate(payment.referenceId, {
			$set: { boostedUntil },
		}).exec();

		this.logger.log(`Property ${payment.referenceId} boosted until ${boostedUntil.toISOString()}`);
	}

	// Runs every hour — clears expired boosts
	@Cron(CronExpression.EVERY_HOUR)
	public async clearExpiredBoosts(): Promise<void> {
		const now = new Date();
		const result = await this.propertyModel.updateMany(
			{ boostedUntil: { $lt: now, $ne: null } },
			{ $set: { boostedUntil: null } },
		).exec();

		if (result.modifiedCount > 0) {
			this.logger.log(`Cleared ${result.modifiedCount} expired boost(s)`);
		}
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
