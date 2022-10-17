import { EmojiIdentifierResolvable, TextChannel } from 'discord.js';
import wordsToNumbers from 'words-to-numbers';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IMessage, IContainer, Maybe } from '../../common/types';
import { CountingDocument, CountingLeaderboardModel } from '../../schemas/games.schema';

export class CountingHandler extends Handler {
  public name: string = 'Counting';
  private _NUMBER_REGEX: RegExp = /^\d+$/;
  private _fizzEmoji: Maybe<EmojiIdentifierResolvable> = null;
  private _buzzEmoji: Maybe<EmojiIdentifierResolvable> = null;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage): Promise<void> {
    // The weird characters 🇫 && 🇧 are converted to the letter emojis in discord
    if (!this._fizzEmoji) {
      this._fizzEmoji = this.container.guildService.getEmoji('fizz') ?? '🇫';
    }

    if (!this._buzzEmoji) {
      this._buzzEmoji = this.container.guildService.getEmoji('buzz') ?? '🇧';
    }

    const chan = message.channel as TextChannel;
    if (chan.name.toLowerCase() !== Constants.Channels.Public.Counting) {
      return;
    }

    message.content = this._replaceWordsWithNumbers(message.content);

    const isValid = await this._isValidMessage(message);
    if (isValid) {
      const number = parseInt(message.content);
      if (number % 3 === 0) {
        await message.react(this._fizzEmoji);
      }
      if (number % 5 === 0) {
        await message.react(this._buzzEmoji);
      }

      // Increment count in counting leaderboard
      const userDoc = await this._getUserCountingDoc(message.author.id);
      await CountingLeaderboardModel.updateOne(userDoc, { $inc: { count: 1 } });
      return;
    }

    await message.delete();
    await message.author.send('Your number was incorrect, please count in order').catch(() => { });
  }

  private _replaceWordsWithNumbers(messageText: string): string {
    // if there are number-words in messageText, replace them with numbers
    const replaced = wordsToNumbers(messageText);
    return replaced ? replaced.toString() : messageText;
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

    prevMessage.content = this._replaceWordsWithNumbers(prevMessage.content);

    const isOnlyNumber = this._NUMBER_REGEX.test(message.content);
    const isNextNumber = parseInt(prevMessage.content) + 1 === parseInt(message.content);

    return isNextNumber && isOnlyNumber;
  }

  private async _getUserCountingDoc(id: string): Promise<CountingDocument> {
    const storedDoc = await CountingLeaderboardModel.findOne({
      userId: id,
      guildId: this.container.guildService.get().id,
    });
    if (!storedDoc) {
      return this._createUserCountingDoc(id);
    }

    return storedDoc;
  }

  private _createUserCountingDoc(id: string): Promise<CountingDocument> {
    return CountingLeaderboardModel.create({
      userId: id,
      guildId: this.container.guildService.get().id,
      count: 0,
    });
  }
}
