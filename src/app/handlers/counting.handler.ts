import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IMessage, IContainer, IHandler } from '../../common/types';

export class CountingHandler implements IHandler {
  private _NUMBER_REGEX: RegExp = /^\d+$/;

  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const chan = message.channel as TextChannel;
    if (chan.name.toLowerCase() !== Constants.Channels.Public.Counting) {
      return;
    }

    const isValid = await this._isValidMessage(message);
    if (isValid) {
      return;
    }

    await message.delete();
    await message.author
      .send('Your number was either incorrect, or you need to wait to count again')
      .catch();
  }

  private async _isValidMessage(message: IMessage) {
    const previousMessages = await message.channel.messages.fetch({ limit: 5, before: message.id });
    if (!previousMessages.size) {
      return true;
    }

    const prevMessage = previousMessages.first();
    if (!prevMessage) {
      return true;
    }

    const isOnlyNumber = this._NUMBER_REGEX.test(message.content);
    const isNextNumber = parseInt(prevMessage.content) + 1 === parseInt(message.content);
    const numMessagesFromUser = previousMessages.filter((m) => m.author === message.author).size;

    return isNextNumber && isOnlyNumber && numMessagesFromUser === 0;
  }
}
