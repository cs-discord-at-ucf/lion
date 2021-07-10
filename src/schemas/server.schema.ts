import mongoose from 'mongoose';
import { ServerCountDocument } from '../common/types';
const { Schema } = mongoose;

const serverInfoSchema = new Schema({
  name: String,
}, { collection: 'serverInfo' });

export const ServerInfoModel = mongoose.model<ServerCountDocument>('serverInfo', serverInfoSchema);
