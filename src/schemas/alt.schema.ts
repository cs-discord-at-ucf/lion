import mongoose from 'mongoose';
import { AltTrackerDocument } from '../app/slash_plugins/alt.plugin';

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
