import { Schema } from 'mongoose';
import { ReportReason, ReportStatus } from '../libs/enums/report.enum';

const ReportSchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Property',
			index: true,
		},

		reporterId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		reason: {
			type: String,
			enum: Object.values(ReportReason),
			required: true,
		},

		description: {
			type: String,
			maxlength: 500,
		},

		status: {
			type: String,
			enum: Object.values(ReportStatus),
			default: ReportStatus.PENDING,
		},
	},
	{ timestamps: true, collection: 'reports' },
);

ReportSchema.index({ propertyId: 1, reporterId: 1 }, { unique: true });

export default ReportSchema;
