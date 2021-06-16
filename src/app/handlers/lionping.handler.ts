import { EmojiIdentifierResolvable } from 'discord.js';
import { IContainer, IHandler, IMessage, Maybe } from '../../common/types';

export class LionPingHandler implements IHandler {
  private _reactEmoji: Maybe<EmojiIdentifierResolvable> = null;

  constructor(public container: IContainer) {}

  public async execute(message: IMessage) {
    if (!this.container.clientService.user) {
      return;
    }

    if (!this._reactEmoji) {
      this._reactEmoji = message.guild?.emojis.cache
        .filter((e) => e.name === 'lion')
        .first() ?? '👍';
    }

    // Check if lion was mentioned.
    const lionId = this.container.clientService.user.id;
    if (!message.mentions.has(lionId)) { 
      return;
    }

    await message.react(this._reactEmoji);
  }
}
