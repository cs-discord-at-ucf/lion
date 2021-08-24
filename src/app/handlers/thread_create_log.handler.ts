import { MessageEmbed, TextChannel, ThreadChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler } from '../../common/types';

export class ThreadCreateLogHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(thread: ThreadChannel): Promise<void> {
    const creatorId = thread.ownerId;
    if (!creatorId) {
      return;
    }

    const creator = this.container.guildService.get().members.cache.get(creatorId)?.user;

    const embed = new MessageEmbed();
    embed.setTitle('New Thread Created');
    embed.addField('Parent Channel', thread.parent?.toString() ?? 'N/A', true);
    embed.addField('Creator', creator?.toString() ?? 'N/A', true);

    const botLogChan = this.container.guildService.getChannel(
      Constants.Channels.Admin.BotLogs
    ) as TextChannel;
    await botLogChan.send({ embeds: [embed] });
  }
}
