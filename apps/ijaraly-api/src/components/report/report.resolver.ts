import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { ReportService } from './report.service';
import { Report } from '../../libs/dto/report/report';
import { CreateReportInput } from '../../libs/dto/report/report.input';
import { ReportStatus } from '../../libs/enums/report.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';

@Resolver()
export class ReportResolver {
	constructor(private readonly reportService: ReportService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Report)
	public async createReport(
		@Args('input') input: CreateReportInput,
		@AuthMember('_id') reporterId: ObjectId,
	): Promise<Report> {
		console.log('Mutation: createReport');
		return await this.reportService.createReport(reporterId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => [Report])
	public async getReports(
		@Args('status', { type: () => ReportStatus, nullable: true }) status?: ReportStatus,
	): Promise<Report[]> {
		console.log('Query: getReports');
		return await this.reportService.getReports(status);
	}
}
