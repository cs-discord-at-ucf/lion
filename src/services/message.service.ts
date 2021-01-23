import { IMessage } from '../common/types';
import { GuildChannel, Guild, TextChannel, MessageEmbed } from 'discord.js';
import { GuildService } from './guild.service';
import Constants from '../common/constants';
import { LoggerService } from './logger.service';

export class MessageService {
  private _botReportingChannel: TextChannel | null = null;
  private _guild: Guild;
  private _linkPrefix: string = 'https://discord.com/channels';

  constructor(private _guildService: GuildService, private _loggerService: LoggerService) {
    this._guild = this._guildService.get();
    this._getBotReportChannel();
  }

  getChannel(message: IMessage) {
    return message.channel as GuildChannel;
  }

  sendBotReport(message: string, options?: {}) {
    this._sendConstructedReport(message, options);
  }

  sendBotReportOnMessage(message: IMessage): void {
    const messageLink = `${this._linkPrefix}/${this._guild.id}/${message.channel.id}/${message.id}`;

    const embed = new MessageEmbed();
    embed.setTitle(`Class Report`);
    embed.setDescription(
      `**New report on ${message.author.toString()} from ${message.channel}**\n\n`
    );

    if (message.content) {
      embed.addField('Content', message.content, false);
    }

    embed.addField('Link', messageLink, false);
    embed.attachFiles(message.attachments.map((e) => e.url));
    this._sendConstructedReport(embed);
  }

  async attempDMUser(message: IMessage, content: string | MessageEmbed) {
    try {
      await message.author.send(content).then(async () => await message.react('👍'));
    } catch {
      await message.channel.send(content).catch((e) => this._loggerService.error(e));
    }
  }

  private _sendConstructedReport(report: string | MessageEmbed, options?: {}) {
    if (!options) {
      this._botReportingChannel?.send(report);
    } else {
      this._botReportingChannel?.send(report, options);
    }
  }

  private _getBotReportChannel(): void {
    const channels = this._guild.channels;
    for (const channel of channels.cache) {
      const [_, channelObject] = channel;
      if (channelObject.name === Constants.Channels.Admin.BotLogs) {
        this._botReportingChannel = channelObject as TextChannel;
        return;
      }
    }
  }
}
