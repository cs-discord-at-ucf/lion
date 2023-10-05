import mongoose from 'mongoose';
import { AltTrackerDocument } from '../app/commands/alt.command';

const { Schema } = mongoose;

const altTrackerSchema = new Schema(
  {
    guildID: String,
    baseID: String,
    knownIDs: [{ type: String }],
  },
  { collection: 'altTracker' }
);

export const AltTrackerModel = mongoose.model<AltTrackerDocument>('altTracker', altTrackerSchema);
