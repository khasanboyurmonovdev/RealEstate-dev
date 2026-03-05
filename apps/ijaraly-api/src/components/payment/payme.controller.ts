import {
	Controller,
	Post,
	Body,
	Headers,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { PaymeService } from './payme.service';

@Controller('payme')
export class PaymeController {
	private readonly logger = new Logger(PaymeController.name);

	constructor(private readonly paymeService: PaymeService) {}

	@Post()
	public async handlePayme(
		@Headers('authorization') authorization: string,
		@Body() body: any,
	): Promise<any> {
		this.validateAuth(authorization);

		const { method, params, id } = body;
		return this.paymeService.handleRpc(method, params, id);
	}

	private validateAuth(authorization: string): void {
		if (!authorization) throw new UnauthorizedException('Missing authorization');

		const base64 = authorization.replace('Basic ', '');
		const decoded = Buffer.from(base64, 'base64').toString('utf8');
		const [login, password] = decoded.split(':');

		const isTest = process.env.PAYME_TEST_MODE === 'true';
		const expectedPassword = isTest
			? process.env.PAYME_TEST_SECRET_KEY
			: process.env.PAYME_SECRET_KEY;
		const expectedLogin = process.env.PAYME_MERCHANT_ID;

		if (login !== expectedLogin || password !== expectedPassword) {
			this.logger.warn(`Payme auth failed — login: ${login}`);
			throw new UnauthorizedException('Invalid Payme credentials');
		}
	}
}
