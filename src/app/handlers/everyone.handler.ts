import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IContainer, IMessage } from '../../common/types';

export class EveryoneHandler extends Handler {
  public name: string = 'EveryonePing';
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage): Promise<void> {
    if (!message.content.includes('@everyone') || !message.content.includes('@here')) {
      return;
    }

    if (!message.member) {
      return;
    }

    const isModerator = this.container.userService.hasRole(message.member, 'admin');
    if (isModerator) {
      return;
    }

    const botLogsChannel = this.container.guildService.getChannel(Constants.Channels.Admin.BotLogs);
    await Promise.all([
      message.author
        .send(
          `\`@everyone\` and \`@here\` pings are not allowed in the ${Constants.ServerName} server`
        )
        .catch(() => {}),
      (botLogsChannel as TextChannel).send(
        `User ${message.author} tried to ping everyone in ${message.channel}`
      ),
    ]);
  }
}
