import { EmojiIdentifierResolvable } from 'discord.js';
import { Handler } from '../../common/handler';
import { IContainer, IMessage, Maybe } from '../../common/types';

export class LionPingHandler extends Handler {
  public name: string = 'LionPing';

  private _reactEmoji: Maybe<EmojiIdentifierResolvable> = null;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    if (!this.container.clientService.user) {
      return;
    }

    if (!this._reactEmoji) {
      this._reactEmoji = this.container.guildService.getEmoji('lion') ?? '👍';
    }

    // Check if lion was mentioned.
    const lionId = this.container.clientService.user.id;
    if (!message.mentions.has(lionId)) {
      return;
    }

    await message.react(this._reactEmoji);
  }
}
