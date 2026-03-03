import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { UseGuards } from '@nestjs/common';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { Member, Members } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { getSerialForImage, shapeIntoMongoObjectId, validMimeTypes } from '../../libs/config';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream } from 'fs';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { SendOtpInput, VerifyOtpInput, OtpResponse } from '../../libs/dto/member/member.otp';
import { TelegramAuthInput } from '../../libs/dto/member/member.telegram';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

@Resolver()
export class MemberResolver {
	constructor(
		private readonly memberService: MemberService,
		private readonly authService: AuthService,
	) {}

	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		console.log('Mutation: signup');
		return await this.memberService.signup(input);
	}

	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		console.log('Mutation: login');
		return await this.memberService.login(input);
	}

	@Mutation(() => OtpResponse)
	public async sendOtp(@Args('input') input: SendOtpInput): Promise<OtpResponse> {
		console.log('Mutation: sendOtp');
		await this.authService.sendOtp(input.memberPhone);
		return { success: true };
	}

	@Mutation(() => Member)
	public async loginWithOtp(@Args('input') input: VerifyOtpInput): Promise<Member> {
		console.log('Mutation: loginWithOtp');
		await this.authService.verifyOtp(input.memberPhone, input.otpCode);
		const member = await this.memberService.findOrCreateByPhone(input.memberPhone);
		member.accessToken = await this.authService.createToken(member);
		member.refreshToken = await this.authService.createRefreshToken(member._id.toString());
		return member;
	}

	@Mutation(() => Member)
	public async loginWithTelegram(@Args('input') input: TelegramAuthInput): Promise<Member> {
		console.log('Mutation: loginWithTelegram');

		const isValid = this.memberService.validateTelegramHash(input);
		if (!isValid) throw new ForbiddenException('INVALID_TELEGRAM_DATA');

		const authAge = Math.floor(Date.now() / 1000) - parseInt(input.auth_date, 10);
		if (authAge > 86400) throw new BadRequestException('TELEGRAM_AUTH_EXPIRED');

		const member = await this.memberService.findOrCreateByTelegram(input);
		member.accessToken = await this.authService.createToken(member);
		member.refreshToken = await this.authService.createRefreshToken(member._id.toString());
		return member;
	}

	@Mutation(() => String)
	public async refreshToken(
		@Args('memberId') memberId: string,
		@Args('refreshToken') refreshToken: string,
	): Promise<string> {
		console.log('Mutation: refreshToken');
		return await this.authService.refreshAccessToken(refreshToken, memberId);
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: Member): Promise<string> {
		console.log('Mutation: checkAuth');
		console.log('memberNcik:', memberNick);
		return `Hi ${memberNick}`;
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
		console.log('Query: checkAuthRoles');
		return `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
	}

	// Authenticated: (USER, AGENT, ADMIN)
	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		console.log('Mutation: updateMember');
		delete input._id;
		return await this.memberService.updateMember(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(@Args('memberId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Member> {
		console.log('Query: getMember');
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getAgents(@Args('input') input: AgentsInquiry, @AuthMember('_id') memberId: ObjectId): Promise<Members> {
		console.log('Query: getAgents');
		return await this.memberService.getAgents(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		console.log('Mutation: likeTargetMember');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}
	/** ADMIN */
	// Authorization: ADMIN
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
		console.log('Query: getAllMembersByAdmin');
		return await this.memberService.getAllMembersByAdmin(input);
	}

	// Authorization: ADMIN
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateMemberByAdmin(@Args('input') input: MemberUpdate): Promise<Member> {
		console.log('Mutation: updateMembersByAdmin');
		return await this.memberService.updateMemberByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async verifyMemberIdentity(
		@Args('memberId') memberId: string,
		@Args('documentUrl') documentUrl: string,
	): Promise<Member> {
		console.log('Mutation: verifyMemberIdentity');
		const id = shapeIntoMongoObjectId(memberId);
		return await this.memberService.verifyMemberIdentity(id, documentUrl);
	}

	/** IMAGE UPLOADER (member.resolver.ts)**/

	@UseGuards(AuthGuard)
	@Mutation((returns) => String)
	public async imageUploader(
		@Args({ name: 'file', type: () => GraphQLUpload })
		{ createReadStream, filename, mimetype }: FileUpload,
		@Args('target') target: String,
	): Promise<string> {
		console.log('Mutation: imageUploader');

		if (!filename) throw new Error(Message.UPLOAD_FAILED);

		const validMime = validMimeTypes.includes(mimetype);

		if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

		const imageName = getSerialForImage(filename);
		const url = `uploads/${target}/${imageName}`;

		const stream = createReadStream();

		const result = await new Promise((resolve, reject) => {
			stream
				.pipe(createWriteStream(url))
				.on('finish', async () => resolve(true))
				.on('error', () => reject(false));
		});
		if (!result) throw new Error(Message.UPLOAD_FAILED);

		return url;
	}

	@UseGuards(AuthGuard)
	@Mutation((returns) => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: String,
	): Promise<string[]> {
		console.log('Mutation: imagesUploader');

		const uploadedImages = [];
		const promisedList = files.map(async (img: Promise<FileUpload>, index: number): Promise<Promise<void>> => {
			try {
				const { filename, mimetype, encoding, createReadStream } = await img;

				const validMime = validMimeTypes.includes(mimetype);
				if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);

				const imageName = getSerialForImage(filename);
				const url = `uploads/${target}/${imageName}`;
				const stream = createReadStream();

				const result = await new Promise((resolve, reject) => {
					stream
						.pipe(createWriteStream(url))
						.on('finish', () => resolve(true))
						.on('error', () => reject(false));
				});
				if (!result) throw new Error(Message.UPLOAD_FAILED);

				uploadedImages[index] = url;
			} catch (err) {
				console.log('Error, file missing!');
			}
		});

		await Promise.all(promisedList);
		return uploadedImages;
	}
}
