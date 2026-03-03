import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 3;

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService');

    constructor(
        private jwtService: JwtService,
        private httpService: HttpService,
        @InjectModel('Otp') private readonly otpModel: Model<any>,
        @InjectModel('Member') private readonly memberModel: Model<Member>,
    ) {}

    /** ─── Password helpers ─── */

    public async hashPassword(memberPassword: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return await bcrypt.hash(memberPassword, salt);
    }

    public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    /** ─── JWT helpers ─── */

    public async createToken(member: Member): Promise<string> {
        const payload: T = {};
        Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
            payload[`${ele}`] = member[`${ele}`];
        });
        delete payload.memberPassword;
        return await this.jwtService.signAsync(payload);
    }

    public async verifyToken(token: string): Promise<Member> {
        const member = await this.jwtService.verifyAsync(token);
        member._id = shapeIntoMongoObjectId(member._id);
        return member;
    }

    /** ─── Refresh token helpers ─── */

    public async createRefreshToken(memberId: string): Promise<string> {
        const plainToken = crypto.randomBytes(40).toString('hex');
        const hashedToken = await bcrypt.hash(plainToken, await bcrypt.genSalt());
        await this.memberModel.findByIdAndUpdate(memberId, { memberRefreshToken: hashedToken });
        return plainToken;
    }

    public async refreshAccessToken(refreshToken: string, memberId: string): Promise<string> {
        const member = await this.memberModel
            .findById(shapeIntoMongoObjectId(memberId))
            .select('+memberRefreshToken')
            .exec();
        if (!member || !member['memberRefreshToken']) {
            throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
        }

        const isMatch = await bcrypt.compare(refreshToken, member['memberRefreshToken']);
        if (!isMatch) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');

        return await this.createToken(member);
    }

    /** ─── OTP helpers ─── */

    private generateOtpCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async getEskizToken(): Promise<string> {
        try {
            const response = await firstValueFrom(
                this.httpService.post('https://notify.eskiz.uz/api/auth/login', {
                    email: process.env.ESKIZ_EMAIL,
                    password: process.env.ESKIZ_PASSWORD,
                }),
            );
            return response.data.data.token;
        } catch (err) {
            this.logger.error('Eskiz auth failed', err?.message);
            throw new InternalServerErrorException('SMS_SERVICE_UNAVAILABLE');
        }
    }

    public async sendOtp(phone: string): Promise<boolean> {
        const plainCode = this.generateOtpCode();
        const hashedCode = await this.hashPassword(plainCode);

        await this.otpModel.deleteMany({ otpPhone: phone });

        await this.otpModel.create({
            otpPhone: phone,
            otpCode: hashedCode,
            otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
            otpAttempts: 0,
        });

        const eskizToken = await this.getEskizToken();
        const mobilePhone = phone.replace(/^\+/, '');

        try {
            await firstValueFrom(
                this.httpService.post(
                    'https://notify.eskiz.uz/api/message/sms/send',
                    {
                        mobile_phone: mobilePhone,
                        message: `Ijaraly: tasdiqlash kodi ${plainCode}`,
                        from: '4546',
                    },
                    { headers: { Authorization: `Bearer ${eskizToken}` } },
                ),
            );
            this.logger.log(`OTP sent to ${mobilePhone}`);
            return true;
        } catch (err) {
            this.logger.error('Eskiz SMS send failed', err?.message);
            throw new InternalServerErrorException('SMS_SEND_FAILED');
        }
    }

    public async verifyOtp(phone: string, code: string): Promise<boolean> {
        const otpDoc = await this.otpModel.findOne({ otpPhone: phone }).exec();
        if (!otpDoc) throw new NotFoundException('OTP_NOT_FOUND');

        if (otpDoc.otpExpiresAt < new Date()) {
            await this.otpModel.deleteOne({ _id: otpDoc._id });
            throw new BadRequestException('OTP_EXPIRED');
        }

        if (otpDoc.otpAttempts >= OTP_MAX_ATTEMPTS) {
            await this.otpModel.deleteOne({ _id: otpDoc._id });
            throw new BadRequestException('MAX_ATTEMPTS');
        }

        const isMatch = await bcrypt.compare(code, otpDoc.otpCode);

        if (isMatch) {
            await this.otpModel.deleteOne({ _id: otpDoc._id });
            return true;
        }

        await this.otpModel.updateOne({ _id: otpDoc._id }, { $inc: { otpAttempts: 1 } });
        throw new BadRequestException('WRONG_CODE');
    }
}
