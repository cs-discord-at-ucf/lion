import { Snowflake } from 'discord.js';
import mongoose from 'mongoose';
const { Schema } = mongoose;

const classTASchema = new Schema({
  userID: String,
  chanID: String,
  guildID: String,
});

export interface ITAEntry {
  userID: Snowflake;
  chanID: Snowflake;
  guildID: Snowflake;
}

export type TADocument = ITAEntry & Document;

export const ClassTAModel = mongoose.model<TADocument>('classTAs', classTASchema);
