import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage } from '../../common/types';

export class BlacklistHandler implements IHandler {
  private _expressions: RegExp[] = [/discord.gg/, /group\s?me/];
  private _whitelistedChannels = new Set([Constants.Channels.Public.Clubs]);
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const channel = message.channel as TextChannel;
    if (this._whitelistedChannels.has(channel.name)) {
      return;
    }
    this._expressions.forEach((expression) => {
      if (message.content.toLowerCase().match(expression)) {
        this.container.messageService.sendBotReport(message);
      }
    });

    if (message.content.toLowerCase().match(/ucf.zoom.us/)) {
      message.author.send(
        'Hey, we are currently not allowing for UCF Zoom links to be posted within the Discord.'
      );
      message.delete();
    }
  }
}
