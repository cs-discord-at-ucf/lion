import { TextChannel, MessageReaction, User, GuildChannel, CategoryChannel, PartialMessage } from 'discord.js';
import { IContainer, IHandler, IMessage, ClassType } from '../../common/types';

export class ReactHandler implements IHandler {
  private _PIN_THRESH = 5;

  constructor(public container: IContainer) {}

  public async execute(reaction: MessageReaction, user: User): Promise<void> {
    const message = reaction.message;
    if (!message) {
      return;
    }

    const channel = message.channel as TextChannel;

    this._handleClassChannelPinRequest(message, channel);
    await this._handleWarningAcknowledge(reaction, user);
  }

  private async _handleWarningAcknowledge(reaction: MessageReaction, user: User) {
    const warnCat = this.container.guildService.getChannel('warnings') as CategoryChannel;
    const chan = reaction.message.channel as GuildChannel;
    if (chan.parent !== warnCat) {
      return;
    }

    // Dont listen to initial reaction by Lion
    if (reaction.users.cache.last()?.id !== chan.name) {
      return;
    }

    // Make sure its the acknowlege reaction, incase they were to send other reactions
    if (reaction.emoji.name !== this.container.warningService.ACKNOWLEDGE_EMOJI) {
      return;
    }

    await this.container.warningService.deleteChan(user.id);
  }

  private _handleClassChannelPinRequest(message: IMessage | PartialMessage, channel: TextChannel) {
    if (!this.container.classService.getClasses(ClassType.ALL).has(channel.name)) {
      return;
    }

    if (message.pinned || !message.pinnable) {
      return;
    }

    const onlyPin = (react: MessageReaction) => react.emoji.name === '📌';

    message
      .awaitReactions({ filter: onlyPin, max: this._PIN_THRESH })
      .then((collection) => {
        const count = collection.first()?.count;
        if (!count) {
          return;
        }

        count >= this._PIN_THRESH && message.pin();
      })
      .catch();
  }
}
