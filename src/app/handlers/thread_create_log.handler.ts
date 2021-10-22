import { MessageEmbed, TextChannel, ThreadChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class ThreadCreateLogHandler extends Handler {
  public name: string = 'ThreadCreateLog';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(thread: ThreadChannel): Promise<void> {
    const creatorId = thread.ownerId;
    if (!creatorId) {
      return;
    }

    const creator = this.container.guildService.get().members.cache.get(creatorId)?.user;

    const embed = new MessageEmbed();
    embed.setTitle('New Thread Created');
    embed.setColor('#ff9233');
    embed.addField('Parent Channel', thread.parent?.toString() ?? 'N/A', true);
    embed.addField('Creator', creator?.toString() ?? 'N/A', true);
    embed.addField('Link to Thread', thread.toString(), true);
    embed.setTimestamp(new Date());

    const botLogChan = this.container.guildService.getChannel(
      Constants.Channels.Admin.BotLogs
    ) as TextChannel;
    await botLogChan.send({ embeds: [embed] });
  }
}
