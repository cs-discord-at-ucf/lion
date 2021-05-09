import { IMessage } from '../common/types';
import { GuildChannel, Guild, TextChannel, MessageEmbed, MessageReaction, User } from 'discord.js';
import { GuildService } from './guild.service';
import Constants from '../common/constants';
import { LoggerService } from './logger.service';
import * as moment from 'moment';

export class MessageService {
  private _botReportingChannel: TextChannel | null = null;
  private _guild: Guild;
  private _linkPrefix: string = 'https://discord.com/channels';
  private _ARROWS = ['⬅️', '➡️'];

  private _TWO_MINUTES: number = moment.duration(2, 'minutes').asMilliseconds();

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

  async reactionMessage(
    message: IMessage,
    messageInfo: MessageEmbed | string,
    reactions: IEmojiTable[],
    lamba: Function
  ): Promise<IMessage> {
    const msg: IMessage = await message.reply(messageInfo);
    await Promise.all(reactions.map((reaction) => msg.react(reaction.emoji)));

    // Sets up the listner for reactions
    const collector = msg.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        reactions.some((reactionKey) => reactionKey.emoji === reaction.emoji.name) &&
        user.id === message.author.id, //Only run if its the caller
      {
        time: this._TWO_MINUTES,
      } //Listen for 2 Minutes
    );

    // runs when a reaction is added
    collector.on('collect', async (reaction: MessageReaction) => {
      // Translate emote to usable arguement for the referenced function.
      const args = reactions.find((e) => e.emoji === reaction.emoji.name);

      if (args) {
        try {
          // runs the sent function, with the data pulled from the emoji key.
          lamba(args.emojiValue);
        } catch (e) {
          this._loggerService.warn(e);
        }
      }
    });

    //Remove all reactions so user knows its no longer available
    collector.on('end', async () => {
      //Ensure message hasnt been deleted
      if (msg.deletable) {
        await msg.reactions.removeAll();
      }
    });

    return msg;
  }

  async sendPagedEmbed(message: IMessage, _pages: MessageEmbed[]): Promise<IMessage> {
    const pages: MessageEmbed[] = _pages.map((e, i) =>
      e.setFooter(`Page ${i + 1} of ${_pages.length}`)
    );

    const msg: IMessage = await message.channel.send(pages[0]);
    await Promise.all(this._ARROWS.map((a) => msg.react(a)));

    const collector = msg.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        this._ARROWS.includes(reaction.emoji.name) && user.id !== msg.author.id, //Only run if its not the bot putting reacts
      {
        time: 1000 * 60 * 10,
      } //Listen for 10 Minutes
    );

    let pageIndex = 0;
    collector.on('collect', async (reaction: MessageReaction) => {
      reaction.emoji.name === '➡️' ? pageIndex++ : pageIndex--;
      pageIndex = (pageIndex + pages.length) % pages.length; //Ensure pageIndex is in bounds

      await reaction.users
        .remove(reaction.users.cache.last()) //Decrement last reaction
        .then(async () => await msg.edit(pages[pageIndex]));
    });

    //Remove all reactions so user knows its no longer available
    collector.on('end', async () => {
      //Ensure message hasnt been deleted
      if (msg.deletable) {
        await msg.reactions.removeAll();
      }
    });

    return msg;
  }

  async generateEmbedList(listItems: string[], options: any): Promise<MessageEmbed> {
    const maxCol = 3;
    const maxRows = 10; // This is a soft limit

    // Setting up number of columns and rows for the list
    const numCols = Math.min(maxCol, Math.ceil(listItems.length / maxRows));
    const numRows = Math.ceil(listItems.length / numCols);

    // If an embed was sent uses it, else makes a new one
    const embedItem = options.embed || new MessageEmbed();

    // Title was sent inserts it into the embed.
    if (options.title) {
      embedItem.setColor('#0099ff').setTitle(options.title);
    }

    // finds out if the list is sorted or not
    const temp = listItems;
    const sortedList = !!temp.reduce(
      (prevRes: any, item: any) => prevRes !== false && item >= prevRes && item
    );

    // Splits the list into numCols as evenly as possible.
    const columns = new Array(numCols).fill(0).map((_) => listItems.splice(0, numRows));

    // Cycles through each column inserting them, and also notes the alphabetic range
    columns.forEach((column) => {
      let header = '\u200B'; //magic value curtesy of discord.js (just inserts blank space)

      if (sortedList) {
        const fromLetter = column[0].charAt(0) || '';
        const toLetter = column[column.length - 1].charAt(0) || '';
        header = `${fromLetter} - ${toLetter}`;
      }

      embedItem.addField(
        header,
        column.join('\n'),
        true // Inline = true, so columns aren't ontop of each other.
      );
    });

    return embedItem;
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

export interface IEmojiTable {
  emoji: string;
  emojiValue: any; // This is what you will send to lambda
}
