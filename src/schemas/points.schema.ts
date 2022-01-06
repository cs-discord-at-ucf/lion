import mongoose from 'mongoose';
import { IUserPoints } from '../common/types';
const { Schema } = mongoose;

const pointsSchema = new Schema({
  userID: String,
  guildID: String,
  numPoints: Number,
});

export const PointsModel = mongoose.model<PointsDocument>('points', pointsSchema);

export type PointsDocument = IUserPoints & Document;
