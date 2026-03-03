import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { VerificationStatus } from '../../libs/enums/verification.enum';

@Injectable()
export class PropertyCronService {
	private readonly logger = new Logger('PropertyCron');

	constructor(@InjectModel('Property') private readonly propertyModel: Model<Property>) {}

	@Cron('0 2 * * *')
	async expireOldListings() {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		const result = await this.propertyModel.updateMany(
			{
				propertyStatus: PropertyStatus.ACTIVE,
				verificationStatus: { $ne: VerificationStatus.VERIFIED },
				createdAt: { $lt: thirtyDaysAgo },
			},
			{
				$set: { propertyStatus: PropertyStatus.EXPIRED },
			},
		);

		this.logger.log(`Expired ${result.modifiedCount} listings`);
	}
}
