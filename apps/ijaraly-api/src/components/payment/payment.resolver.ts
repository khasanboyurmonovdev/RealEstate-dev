import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Member } from '../../libs/dto/member/member';
import { PaymentService } from './payment.service';
import { InitiatePaymentInput } from '../../libs/dto/payment/payment.input';
import { InitiatePaymentResult, PaymentRecord } from '../../libs/dto/payment/payment';
import { BoostService } from './boost.service';
import { InitiateBoostInput } from '../../libs/dto/payment/boost.input';

@Resolver()
export class PaymentResolver {
	constructor(
		private readonly paymentService: PaymentService,
		private readonly boostService: BoostService,
	) {}

	@Mutation(() => InitiatePaymentResult)
	@UseGuards(AuthGuard)
	public async initiatePayment(
		@Args('input') input: InitiatePaymentInput,
		@AuthMember() authMember: Member,
	): Promise<InitiatePaymentResult> {
		return this.paymentService.initiatePayment(input, authMember);
	}

	@Query(() => [PaymentRecord])
	@UseGuards(AuthGuard)
	public async getMyPayments(
		@AuthMember() authMember: Member,
	): Promise<PaymentRecord[]> {
		return this.paymentService.getMyPayments(authMember);
	}

	@Mutation(() => InitiatePaymentResult)
	@UseGuards(AuthGuard)
	public async initiateBoost(
		@Args('input') input: InitiateBoostInput,
		@AuthMember() authMember: Member,
	): Promise<InitiatePaymentResult> {
		return this.boostService.initiateBoost(
			input.propertyId,
			input.days,
			input.provider,
			authMember,
		);
	}
}
