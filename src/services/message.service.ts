import { IMessage, ITextMessageOptions } from '../common/types';
import { Message, Guild, MessageEmbed, MessageReaction, User } from 'discord.js';
import { GuildChannel, TextChannel, DMChannel, NewsChannel } from 'discord.js';
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
    argOptions?: ITextMessageOptions
  ): Promise<void> {
    const options: ITextMessageOptions = argOptions || {};

    options.title = options.title?.substring(0, 1000) || '';
    options.header = options.header ? `${options.header}\n` : '';
    options.footer = options.footer ? `\n${options.footer}` : '';
    options.delimiter = options.delimiter === '*' ? '' : options.delimiter || '\n';

    const replyLength = options.reply ? `${message.author},  `.length : 0;
    const templateLength = replyLength + options.header.length + options.footer.length;

    let messagesToSend: string[] = [`${options.title}${options.header}${content}${options.footer}`];

    if (!options.header && !options.footer && !options.title) {
      if (options.dm) {
        return this._deliverMessage(options.dm, messagesToSend, options.delimiter);
      }
      return this._deliverMessage(message.channel, messagesToSend, options.delimiter);
    }

    messagesToSend = this._constructMessages(
      content.split(options.delimiter),
      templateLength - options.header.length,
      options
    );

    if (!messagesToSend) {
      this._loggerService.warn('Impossible to split message up with current delimiter.');
      return Promise.reject('Impossible to split message up with current delimiter.');
    }

    if (options.dm) {
      return this._deliverMessage(options.dm, messagesToSend, options.delimiter);
    }
    return this._deliverMessage(message.channel, messagesToSend, options.delimiter);
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

  private _constructMessages(
    splitMessage: string[],
    templateLength: number,
    options: ITextMessageOptions
  ): string[] {
    const messagesToSend = [];
    const numOfFreeChars = Constants.MaxMessageLength - templateLength;

    let temp = [`${options.title}${options.header}`];
    let tempLen = temp[0].length;

    while (splitMessage.length > 0) {
      while (tempLen < numOfFreeChars && splitMessage.length > 0) {
        const nextCapsule = `${splitMessage.shift()}${options.delimiter}` || '';
        tempLen += nextCapsule.length;
        temp.push(nextCapsule);
      }

      //One of the chunks are too big
      if (temp.length < 3 && splitMessage.length > 0) {
        return [];
      }

      if (tempLen > numOfFreeChars) {
        splitMessage.unshift(temp.pop()?.slice(0, -`${options.delimiter}`.length) || '');
      }

      messagesToSend.push(`${temp.join('')}${options.footer}`);

      temp = [`${options.header}`];
      tempLen = temp[0].length;
    }

    return messagesToSend;
  }

  private async _deliverMessage(
    channel: TextChannel | DMChannel | NewsChannel | User,
    content: string[],
    delimiter: string,
    message?: Message
  ): Promise<void> {
    if (message) {
      message.reply(content.pop() || '');
    }

    const status = await Promise.all(
      content.map((item) => {
        channel.send(item, { split: { char: delimiter } }).catch((err) => {
          this._loggerService.warn(`Failed to construct all messages.  Error info:\n${err}`);
          return Promise.reject();
        });
        return Promise.resolve();
      })
    );

    return status[-1];
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
