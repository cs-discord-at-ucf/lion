import { MessageEmbed, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage } from '../../common/types';

export class PingDeleteHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage) {
    const totalPings = message.mentions.users.size + message.mentions.roles.size;
    if (!totalPings) {
      return;
    }

    const embed = new MessageEmbed();
    embed.setTitle('Ghost Ping');
    embed.addField('Message content', message.content);
    embed.addField('Author', message.author.toString());
    embed.setFooter('Be sure to check audit log to make sure a mod did not delete this message');
    embed.setTimestamp(new Date());

    const botLogChan = this.container.guildService.getChannel(
      Constants.Channels.Admin.BotLogs
    ) as TextChannel;
    await botLogChan.send({ embeds: [embed] });
  }
}
