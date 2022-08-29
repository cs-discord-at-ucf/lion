import mongoose from 'mongoose';
import { IUserPoints } from '../common/types';
const { Schema } = mongoose;

const pointsSchema = new Schema({
  userID: String,
  guildID: String,
  numPoints: Number,
  lastKingCrowning: Date,
});

export const PointsModel = mongoose.model<PointsDocument>('points', pointsSchema);

export type PointsDocument = IUserPoints & Document;
