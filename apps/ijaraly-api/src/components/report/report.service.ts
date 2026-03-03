import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Report } from '../../libs/dto/report/report';
import { CreateReportInput } from '../../libs/dto/report/report.input';
import { ReportStatus } from '../../libs/enums/report.enum';
import { Message } from '../../libs/enums/common.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class ReportService {
	constructor(@InjectModel('Report') private readonly reportModel: Model<Report>) {}

	public async createReport(reporterId: ObjectId, input: CreateReportInput): Promise<Report> {
		const propertyId = shapeIntoMongoObjectId(input.propertyId);

		const existing = await this.reportModel
			.findOne({ propertyId, reporterId })
			.exec();
		if (existing) throw new BadRequestException('ALREADY_REPORTED');

		try {
			return await this.reportModel.create({
				propertyId,
				reporterId,
				reason: input.reason,
				description: input.description,
			});
		} catch (err) {
			console.error('createReport error:', err);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}

	public async getReports(status?: ReportStatus): Promise<Report[]> {
		const match: Record<string, any> = {};
		if (status) match.status = status;

		return await this.reportModel
			.find(match)
			.sort({ createdAt: -1 })
			.exec();
	}
}
