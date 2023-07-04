import { EmbedBuilder, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IContainer, IMessage } from '../../common/types';

export class PingDeleteHandler extends Handler {
  public name: string = 'PingDelete';

  private readonly _GHOST_IMAGE_URL: string =
    'https://www.clipartmax.com/png/middle/45-459156_cartoon-ghost-transparent-background.png';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const totalPings = message.mentions.users.size + message.mentions.roles.size;
    if (!totalPings) {
      return;
    }

    // Ignore messages from the bot
    if (message.author.id === this.container.clientService.user?.id) {
      return;
    }

    const isReply = Boolean(message.mentions.repliedUser);

    const embed = new EmbedBuilder();
    embed.setTitle('Ghost Ping');
    embed.setThumbnail(this._GHOST_IMAGE_URL);

    embed.setColor('White');

    embed.addFields([
      { name: 'Message content', value: message.content },
      { name: 'Channel', value: message.channel.toString() },
      { name: 'Author', value: message.author.toString() },
      { name: 'Is a reply', value: isReply ? 'Yes' : 'No' },
    ]);

    embed.setFooter({
      text: 'Be sure to check audit log to make sure a mod did not delete this message',
    });
    embed.setTimestamp(new Date());

    const botLogChan = this.container.guildService.getChannel(
      Constants.Channels.Admin.BotLogs
    ) as TextChannel;
    await botLogChan.send({ embeds: [embed] });
  }
}
