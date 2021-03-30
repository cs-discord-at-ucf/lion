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

  async sendMessage(
    message: IMessage,
    content: string,
    reply: boolean,
    argHeader?: string,
    argFooter?: string,
    argBreakChar?: string
  ): Promise<Boolean> {
    const header = argHeader ? argHeader + '\n' : '';
    const footer = argFooter ? '\n' + argFooter : '';
    const breakChar = argBreakChar || '';

    const replyLength = reply ? ('<@' + message.member?.id + '>,  ').length : 0;
    const miscLength = header.length + footer.length;

    let messagesToSend: string[] = [header + content + footer];

    if (content.length + miscLength + replyLength > Constants.MaxMessageLength) {
      if (!breakChar) {
        return this._failedToSend(message, `Message was over Discords character cap.`);
      }

      messagesToSend = this._splitMessage(content, breakChar, replyLength + miscLength);
      if (!this._testMessages(messagesToSend, content.length, replyLength)) {
        return this._failedToSend(message, `Failed to split the message up within the rule set.`);
      }
      messagesToSend = messagesToSend.map((message) => header + message + footer);
    }

    if (reply) {
      message.reply(messagesToSend.shift() || '');
    }

    messagesToSend.forEach((val) => {
      message.channel.send(val);
    });

    return true;
  }

  async attempDMUser(message: IMessage, content: string | MessageEmbed) {
    try {
      await message.author.send(content).then(async () => await message.react('👍'));
    } catch {
      await message.channel.send(content).catch((e) => this._loggerService.error(e));
    }
  }

  async sendPagedEmbed(message: IMessage, _pages: MessageEmbed[]): Promise<IMessage> {
    const pages: MessageEmbed[] = _pages.map((e, i) =>
      e.setFooter(`Page ${i + 1} of ${_pages.length}`)
    );

    const msg: IMessage = await message.channel.send(pages[0]);
    if (pages.length > 1) {
      msg.react('➡️');
    }

    const collector = msg.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id !== msg.author.id, //Only run if its not the bot putting reacts
      { time: 1000 * 60 * 10 } //Listen for 10 Minutes
    );

    let pageIndex = 0;
    collector.on('collect', async (reaction: MessageReaction) => {
      await msg.reactions.removeAll().then(async () => {
        reaction.emoji.name === '➡️' ? pageIndex++ : pageIndex--;
        pageIndex = (pageIndex + pages.length) % pages.length; //Ensure pageIndex is in bounds

        await msg.edit(pages[pageIndex]);

        if (pageIndex !== 0) {
          await msg.react('⬅️');
        }
        if (pageIndex + 1 < pages.length) {
          await msg.react('➡️');
        }
      });
    });

    return msg;
  }

  private _failedToSend(message: IMessage, reason: string): boolean {
    message.reply('Sorry the bot cannot send this message because:\n' + reason);
    return false;
  }

  private _splitMessage(message: string, argBreakChar: string, numOfMiscChars: number): string[] {
    const numOfFreeChars = Constants.MaxMessageLength - numOfMiscChars;
    const breakChar = argBreakChar === '*' ? '(.|\n)' : argBreakChar;

    const messageSplitRegExp: RegExp = new RegExp(
      `(.|\n){1,${numOfFreeChars}}(${breakChar}|$)`,
      'gm'
    );

    return message.match(messageSplitRegExp) || [];
  }

  private _testMessages(messages: string[], testLength: number, replyLength: number): boolean {
    let messageCheckCount: number = 0;

    messages.forEach((message) => {
      messageCheckCount += message.length;
    });

    if (testLength != messageCheckCount) {
      return false;
    }
    return true;
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
