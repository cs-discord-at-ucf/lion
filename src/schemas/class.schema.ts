import mongoose from 'mongoose';
import { TADocument } from '../app/slash_plugins/ta.plugin';
const { Schema } = mongoose;

const classTASchema = new Schema({
  userID: String,
  chanID: String,
  guildID: String,
});

export const ClassTAModel = mongoose.model<TADocument>('classTAs', classTASchema);
