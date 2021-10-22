import mongoose from 'mongoose';
import { PluginStateDocument } from '../services/plugin.service';
const { Schema } = mongoose;

const runnableStateSchema = new Schema(
  {
    name: String,
    isActive: Boolean,
    guildID: String,
  },
  { collection: 'pluginState' }
);

export const RunnableStateModel = mongoose.model<PluginStateDocument>(
  'pluginState',
  runnableStateSchema
);
