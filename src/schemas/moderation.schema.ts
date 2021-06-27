import mongoose from 'mongoose';
import { Moderation } from '../services/moderation.service';
const { Schema } = mongoose;

// Moderation Report

const moderationReportSchema = new Schema({
  guild: String,
  user: String,
  description: { type: String, required: false },
  attachments: [{ type: String, required: false }],
  timeStr: String,
}, { collection: 'modreports' });

export const ModerationReportModel = mongoose.model<Moderation.ModerationReportDocument>('modreports', moderationReportSchema);

// Moderation Ban

const moderationBanSchema = new Schema({
  user: String,
  guild: String,
  date: Date,
  active: Boolean,
  reason: String,
  reportId: Schema.Types.ObjectId,
}, { collection: 'modbans' });

export const ModerationBanModel = mongoose.model<Moderation.ModerationBanDocument>('modbans', moderationBanSchema);

// Moderation Warnings.

const moderationWarningSchema = new Schema({
  user: String,
  guild: String,
  date: Date,
  reportId: { type: Schema.Types.ObjectId, required: false },
}, { collection: 'modwarnings' });

export const ModerationWarningModel = mongoose.model<Moderation.ModerationWarningDocument>('modwarnings', moderationWarningSchema);
