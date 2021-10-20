import { MessageEmbed, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage } from '../../common/types';

export class PingDeleteHandler implements IHandler {
  private readonly _GHOST_IMAGE_URL: string =
    'https://www.clipartmax.com/png/middle/45-459156_cartoon-ghost-transparent-background.png';

  constructor(public container: IContainer) {}

  public async execute(message: IMessage) {
    const totalPings = message.mentions.users.size + message.mentions.roles.size;
    if (!totalPings) {
      return;
    }

    const isReply = Boolean(message.mentions.repliedUser);

    const embed = new MessageEmbed();
    embed.setTitle('Ghost Ping');
    embed.setThumbnail(this._GHOST_IMAGE_URL);
    embed.setColor('WHITE');

    embed.addField('Message content', message.content, true);
    embed.addField('Channel', message.channel.toString(), true);
    embed.addField('Author', message.author.toString(), true);
    embed.addField('Is a reply', isReply ? 'Yes' : 'No', true);

    embed.setFooter('Be sure to check audit log to make sure a mod did not delete this message');
    embed.setTimestamp(new Date());

    const botLogChan = this.container.guildService.getChannel(
      Constants.Channels.Admin.BotLogs
    ) as TextChannel;
    await botLogChan.send({ embeds: [embed] });
  }
}
