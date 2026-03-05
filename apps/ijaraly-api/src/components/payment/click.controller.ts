import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ClickService } from './click.service';

@Controller('click')
export class ClickController {
	private readonly logger = new Logger(ClickController.name);

	constructor(private readonly clickService: ClickService) {}

	@Post('prepare')
	public async prepare(@Body() body: any): Promise<any> {
		this.logger.log(`Click prepare: order=${body?.merchant_trans_id}`);
		return this.clickService.prepare(body);
	}

	@Post('complete')
	public async complete(@Body() body: any): Promise<any> {
		this.logger.log(`Click complete: order=${body?.merchant_trans_id}`);
		return this.clickService.complete(body);
	}
}
