import { TextChannel, MessageReaction } from 'discord.js';
import { IContainer, IHandler, IMessage, ClassType } from '../../common/types';

export class ReactHandler implements IHandler {
  private _PIN_THRESH = 5;

  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const channel = message.channel as TextChannel;

    this._handleClassChannelPinRequest(message, channel);
  }
  private async _handleClassChannelPinRequest(message: IMessage, channel: TextChannel) {
    if (!this.container.classService.getClasses(ClassType.ALL).has(channel.name)) {
      return;
    }

    if (message.pinned || !message.pinnable) {
      return;
    }

    const onlyPin = (react: MessageReaction) => react.emoji.name === '📌';

    message
      .awaitReactions(onlyPin, { max: this._PIN_THRESH })
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
