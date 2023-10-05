import mongoose from 'mongoose';
import { TADocument } from '../app/commands/ta.command';
const { Schema } = mongoose;

const classTASchema = new Schema({
  userID: String,
  chanID: String,
  guildID: String,
});

export const ClassTAModel = mongoose.model<TADocument>('classTAs', classTASchema);
