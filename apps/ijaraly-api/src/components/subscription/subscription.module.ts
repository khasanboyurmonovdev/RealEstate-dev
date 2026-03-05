import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionService } from './subscription.service';
import { SubscriptionResolver } from './subscription.resolver';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		AuthModule,
	],
	providers: [SubscriptionService, SubscriptionResolver],
	exports: [SubscriptionService],
})
export class SubscriptionModule {}
