import mongoose from 'mongoose';
import { TADocument } from '../app/plugins/ta.plugin';
import { ClassPinDocument } from '../app/plugins/storepins.plugin';
const { Schema } = mongoose;

const classTASchema = new Schema({
  userID: String,
  chanID: String,
  guildID: String,
});

export const ClassTAModel = mongoose.model<TADocument>('classTAs', classTASchema);

const classPinSchema = new Schema({
  messageContent: String,
  className: String,
  date: Date,
  guildID: String,
}, { collection: 'pins'});

export const ClassPinModel = mongoose.model<ClassPinDocument>('pins', classPinSchema);
