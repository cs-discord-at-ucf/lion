import mongoose from 'mongoose';
import { ClassPinDocument } from '../app/plugins/storepins.plugin';
const { Schema } = mongoose;

const classPinSchema = new Schema({
    messageContent: String,
    className: String,
    date: Date,
    guildID: String,
}, { collection: 'pins'});

export const ClassPinModel = mongoose.model<ClassPinDocument>('pins', classPinSchema);