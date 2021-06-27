import mongoose from 'mongoose';
import { ServerInfoDocument } from '../common/types';
const { Schema } = mongoose;

const serverInfoSchema = new Schema({
  name: String,
}, { collection: 'serverInfo' });

export const ServerInfoModel = mongoose.model<ServerInfoDocument>('serverInfo', serverInfoSchema);
