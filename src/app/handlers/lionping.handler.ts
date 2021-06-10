import { EmojiIdentifierResolvable } from 'discord.js';
import { IContainer, IHandler, IMessage, Maybe } from '../../common/types';

export class LionPingHandler implements IHandler {
  public mentionRegex: RegExp = /<@!?\d+>/g;
  private _reactEmoji: Maybe<EmojiIdentifierResolvable> = null;

  constructor(public container: IContainer) {}

  public async execute(message: IMessage) {
    if (!this.container.clientService.user) {
      return;
    }

    const len = message.mentions.members?.size;

    if (!this._reactEmoji) {
      this._reactEmoji =
        message.guild?.emojis.cache.filter((e) => e.name === 'lion').first() || '👍';
    }

    // if there is a mention in the message
    const match = message.content.match(this.mentionRegex);
    if (!match) {
      return;
    }

    const lionId = this.container.clientService.user.id;
    // if lion's id exists somewhere in the mentions of the message
    const lionPinged = match.some((m) => m.indexOf(lionId) !== -1);

    // if lion was pinged
    if (lionPinged) {
      await message.react(this._reactEmoji);
    }
  }
}
