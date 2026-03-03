import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import OtpSchema from '../../schemas/Otp.model';
import MemberSchema from '../../schemas/Member.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Otp', schema: OtpSchema },
      { name: 'Member', schema: MemberSchema },
    ]),
    HttpModule,
    JwtModule.register({
      secret: `${process.env.SECRET_TOKEN}`,
      signOptions: {expiresIn: '30d'},
    }),
  ],
  providers: [AuthService],
  exports: [AuthService, MongooseModule],
})
export class AuthModule {}
