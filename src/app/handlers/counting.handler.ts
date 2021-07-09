import { EmojiIdentifierResolvable, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IMessage, IContainer, IHandler, Maybe } from '../../common/types';

export class CountingHandler implements IHandler {
  private _NUMBER_REGEX: RegExp = /^\d+$/;
  private _fizzEmoji: Maybe<EmojiIdentifierResolvable> = null;
  private _buzzEmoji: Maybe<EmojiIdentifierResolvable> = null;

  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    if (!this._fizzEmoji || !this._buzzEmoji) {
      this._getEmojis();
    }

    const chan = message.channel as TextChannel;
    if (chan.name.toLowerCase() !== Constants.Channels.Public.Counting) {
      return;
    }

    const isValid = await this._isValidMessage(message);
    if (isValid) {
      const number = parseInt(message.content);
      if (number % 3 === 0) {
        await message.react(this._fizzEmoji!);
      }
      if (number % 5 === 0) {
        await message.react(this._buzzEmoji!);
      }

      return;
    }

    await message.delete();
    await message.author.send('Your number was incorrect, please count in order').catch(() => {});
  }

  private async _isValidMessage(message: IMessage) {
    const previousMessage = await message.channel.messages.fetch({
      limit: 1,
      before: message.id,
    });
    if (!previousMessage.size) {
      return true;
    }

    const prevMessage = previousMessage.first();
    if (!prevMessage) {
      return true;
    }

    const isOnlyNumber = this._NUMBER_REGEX.test(message.content);
    const isNextNumber = parseInt(prevMessage.content) + 1 === parseInt(message.content);

    return isNextNumber && isOnlyNumber;
  }

  private _getEmojis() {
    // The weird chars 🇫 && 🇧 are converted to the letter emojis in discord
    this._fizzEmoji =
      this.container.guildService
        .get()
        .emojis.cache.filter((emoji) => emoji.name.toLowerCase() === 'fizz')
        .first() ?? '🇫';

    this._buzzEmoji =
      this.container.guildService
        .get()
        .emojis.cache.filter((emoji) => emoji.name.toLowerCase() === 'buzz')
        .first() ?? '🇧';
  }
}
