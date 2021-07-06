import { IMessage, IEmbedData, IReactionOptions } from '../common/types';
import { GuildChannel, Guild, TextChannel, MessageEmbed, MessageReaction, User } from 'discord.js';
import { GuildService } from './guild.service';
import Constants from '../common/constants';
import ms from 'ms';
import winston from 'winston';

export class MessageService {
  private _botReportingChannel: TextChannel | null = null;
  private _guild: Guild;
  private _linkPrefix: string = 'https://discord.com/channels';
  private _ARROWS = ['⬅️', '➡️'];
  private _CANCEL_EMOTE = '❎';

  constructor(private _guildService: GuildService) {
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
    let report = `New report on ${message.author} from ${message.channel}:\n`;
    if (message.content.length) {
      report += `\`\`\`${message.content.replace(/`/g, '')}\`\`\``;
    }
    report += `${this._linkPrefix}/${this._guild.id}/${message.channel.id}/${message.id}`;
    this._sendConstructedReport(report, { files: message.attachments.map((e) => e.url) });
  }

  async attemptDMUser(message: IMessage, content: string | MessageEmbed) {
    try {
      await message.author.send(content).then(async () => await message.react('👍'));
    } catch {
      await message.channel.send(content).catch(winston.error);
    }
  }

  async sendReactiveMessage(
    message: IMessage,
    embedData: IEmbedData,
    lambda: Function,
    options: IReactionOptions
  ): Promise<IMessage> {
    const msg: IMessage = await message.reply(embedData.embeddedMessage);
    const minEmotes: number = embedData.emojiData.length - (options.reactionCutoff ?? 1);

    await Promise.all(embedData.emojiData.map((reaction) => msg.react(reaction.emoji)));
    await msg.react(this._CANCEL_EMOTE); // Makes cancel available on all reactions (We could also make it an option in the future)

    // Sets up the listener for reactions
    const collector = msg.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        (embedData.emojiData.some((reactionKey) => reactionKey.emoji === reaction.emoji.name) ||
          reaction.emoji.name === this._CANCEL_EMOTE) &&
        user.id === message.author.id, // Only run if its the caller
      {
        time: ms('2m'),
      } // Listen for 2 Minutes
    );

    // runs when a reaction is added
    collector.on('collect', async (reaction: MessageReaction) => {
      // Translate emote to usable argument for the referenced function.

      if (reaction.emoji.name === this._CANCEL_EMOTE) {
        collector.stop();
        return;
      }

      const targetData = embedData.emojiData.find((e) => e.emoji === reaction.emoji.name);
      if (!targetData) {
        return;
      }

      try {
        // Runs the sent function, with the data pulled from the emoji key.
        lambda(targetData.args);

        // Removes the used emote to prevent it from running multiple times.
        embedData.emojiData = embedData.emojiData.filter((e) => e.emoji !== reaction.emoji.name);

        if (embedData.emojiData.length > minEmotes) {
          return;
        }

        if (options.cutoffMessage) {
          await msg.edit(options.cutoffMessage);
          if (typeof options.cutoffMessage === 'string') {
            await msg.suppressEmbeds(true);
          }
        }

        collector.stop();
      } catch (e) {
        winston.warn(e);
      }
    });

    // Remove all reactions so user knows its no longer available
    collector.on('end', async () => {
      // Ensure message hasn't been deleted
      if (!msg.deletable) {
        return;
      }

      await msg.reactions.removeAll();

      if (options.closingMessage && !msg.editedAt) {
        await msg.edit(options.closingMessage);
        if (typeof options.closingMessage === 'string') {
          await msg.suppressEmbeds(true);
        }
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
        this._ARROWS.includes(reaction.emoji.name) && user.id !== msg.author.id, // Only run if its not the bot putting reacts
      {
        time: 1000 * 60 * 10,
      } // Listen for 10 Minutes
    );

    let pageIndex = 0;
    collector.on('collect', async (reaction: MessageReaction) => {
      reaction.emoji.name === '➡️' ? pageIndex++ : pageIndex--;
      pageIndex = (pageIndex + pages.length) % pages.length; // Ensure pageIndex is in bounds

      await reaction.users
        .remove(reaction.users.cache.last()) // Decrement last reaction
        .then(async () => await msg.edit(pages[pageIndex]));
    });

    // Remove all reactions so user knows its no longer available
    collector.on('end', async () => {
      // Ensure message hasn't been deleted
      if (msg.deletable) {
        await msg.reactions.removeAll();
      }
    });

    return msg;
  }

  generateEmbedList(listItems: string[]): MessageEmbed {
    const maxCol = 3;
    const maxRows = 10; // This is a soft limit

    // Setting up number of columns and rows for the list
    const numCols = Math.min(maxCol, Math.ceil(listItems.length / maxRows));
    const numRows = Math.ceil(listItems.length / numCols);

    // If an embed was sent uses it, else makes a new one
    const embedItem = new MessageEmbed();

    // finds out if the list is sorted or not
    const temp = listItems.slice(0);
    const sortedList = temp.every((val: string, i: number) => {
      if (i === 0) {
        return true;
      }

      // Check if current element is greater than the last
      return val >= temp[i - 1];
    });

    // Splits the list into numCols as evenly as possible.
    const columns = new Array(numCols).fill(0).map(() => temp.splice(0, numRows));

    // Cycles through each column inserting them, and also notes the alphabetic range
    columns.forEach((column) => {
      let header = '\u200B'; // Magic value curtesy of discord.js (just inserts blank space)

      if (sortedList) {
        const fromLetter = column[0].charAt(0) || '';
        const toLetter = column[column.length - 1].charAt(0) || '';
        header = `${fromLetter} - ${toLetter}`;
      }

      embedItem.addField(
        header,
        column.join('\n'),
        true // Inline = true, so columns aren't on top of each other.
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
      const [, channelObject] = channel;
      if (channelObject.name === Constants.Channels.Admin.BotLogs) {
        this._botReportingChannel = channelObject as TextChannel;
        return;
      }
    }
  }
}
