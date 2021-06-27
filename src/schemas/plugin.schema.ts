import mongoose from 'mongoose';
import { PluginStateDocument } from '../services/plugin.service';
const { Schema } = mongoose;

const pluginStateSchema = new Schema({
  name: String,
  isActive: Boolean,
  guildID: String,
}, { collection: 'pluginState'} );

export const PluginStateModel = mongoose.model<PluginStateDocument>('pluginState', pluginStateSchema);
