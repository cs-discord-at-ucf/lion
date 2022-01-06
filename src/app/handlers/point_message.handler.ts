import { GuildChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IContainer, IMessage } from '../../common/types';

export class PointMessageHandler extends Handler {
  public name: string = 'PointMessage';
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage): Promise<void> {
    if ((message.channel as GuildChannel).name === Constants.Channels.Bot.BotChannel) {
      return;
    }

    await this.container.pointService.awardPoints(message.author.id, 1);
  }
}
