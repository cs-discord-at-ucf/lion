import { IMessage } from '../common/types';
import { GuildChannel } from 'discord.js';

export class MessageService {
  getChannel(message: IMessage) {
    return message.channel as GuildChannel;
  }
}
