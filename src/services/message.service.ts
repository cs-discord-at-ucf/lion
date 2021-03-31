import { IMessage, ITextMessageOptions } from '../common/types';
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

  async sendTextMessage(
    message: IMessage,
    content: string,
    argOptions: ITextMessageOptions
  ): Promise<void> {
    const options: ITextMessageOptions = {};
    options.header = argOptions.header ? `${argOptions.header}\n` : '';
    options.footer = argOptions.footer ? `\n${argOptions.footer}` : '';
    options.reply = argOptions.reply || false;
    options.delimiter = argOptions.delimiter || '';

    const replyLength = options.reply ? `${message.author},  `.length : 0;
    const templateLength = options.header.length + options.footer.length;

    let messagesToSend: string[] | null = [`${options.header}${content}${options.footer}`];

    if (content.length + templateLength + replyLength > Constants.MaxMessageLength) {
      if (!options.delimiter) {
        return Promise.reject(`Message was over Discords character cap.`);
      }

      messagesToSend = this._splitMessage(content, options.delimiter, replyLength + templateLength);

      if (!messagesToSend || !this._testMessages(messagesToSend, content.length)) {
        return Promise.reject(`Failed to split the message up within the rule set.`);
      }
      messagesToSend = messagesToSend.map((message) => options.header + message + options.footer);
    }

    if (options.reply) {
      message.reply(messagesToSend.shift() || '');
    }

    await Promise.all(
      messagesToSend.map((val) => {
        message.channel.send(val);
      })
    ).catch(function(err) {
      return Promise.reject(`Failed to post one of the requested messages error Info:\n${err}`);
    });
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

  private _splitMessage(
    message: string,
    argDelimiter: string,
    templateLength: number
  ): string[] | null {
    const numOfFreeChars = Constants.MaxMessageLength - templateLength;
    const delimiter = argDelimiter === '*' ? '(.|\n)' : argDelimiter;

    const messageSplitRegExp: RegExp = new RegExp(
      `(.|\n){1,${numOfFreeChars}}(${delimiter}|$)`,
      'gm'
    );

    return message.match(messageSplitRegExp);
  }

  private _testMessages(messages: string[], testLength: number): boolean {
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
