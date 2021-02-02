import { IMessage } from '../common/types';
import { GuildChannel, Guild, TextChannel, MessageEmbed, MessageReaction, User } from 'discord.js';
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
    let report = `New report on ${message.author.username}#${message.author.discriminator} from ${message.channel}:\n`;
    if (message.content.length) {
      report += `\`\`\`${message.content.replace(/`/g, '')}\`\`\``;
    }
    report += `${this._linkPrefix}/${this._guild.id}/${message.channel.id}/${message.id}`;
    this._sendConstructedReport(report, { files: message.attachments.map((e) => e.url) });
  }

  async attempDMUser(message: IMessage, content: string | MessageEmbed) {
    try {
      await message.author.send(content).then(async () => await message.react('👍'));
    } catch {
      await message.channel.send(content).catch((e) => this._loggerService.error(e));
    }
  }

  async sendPagedEmbed(message: IMessage, pages: MessageEmbed[]): Promise<IMessage> {
    const msg: IMessage = await message.channel.send(pages[0]);

    msg.react('➡️');
    const collecter = msg.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id !== msg.author.id, //Only run if its not the bot putting reacts
      { time: 1000 * 60 * 10 } //Listen for 10 Minutes
    );

    let pageIndex = 0;
    collecter.on('collect', (reaction: MessageReaction) => {
      msg.reactions.removeAll().then(async () => {
        reaction.emoji.name === '➡️' ? pageIndex++ : pageIndex--;
        msg.edit(pages[pageIndex]);

        if (pageIndex !== 0) {
          msg.react('⬅️');
        }
        if (pageIndex + 1 < pages.length) {
          msg.react('➡️');
        }
      });
    });

    return msg;
  }

  private _sendConstructedReport(report: string, options?: {}) {
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
