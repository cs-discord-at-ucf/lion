import { IMessage, IReactionOptions, Maybe, IInteractionEmbedData } from '../common/types';
import {
  GuildChannel,
  Guild,
  TextChannel,
  MessageEmbed,
  MessageReaction,
  User,
  MessagePayload,
  MessageOptions,
  MessageEmbedAuthor,
  CommandInteraction,
  Interaction,
  GuildMember,
} from 'discord.js';
import { GuildService } from './guild.service';
import Constants from '../common/constants';
import { LoggerService } from './logger.service';
import ms from 'ms';

export class MessageService {
  private _botReportingChannel: TextChannel;
  private _guild: Guild;
  private _linkPrefix: string = 'https://discord.com/channels';
  private _ARROWS = ['⬅️', '➡️'];
  private _cancelCustomId = 'cancelClassRegistration';

  constructor(private _guildService: GuildService, private _loggerService: LoggerService) {
    this._guild = this._guildService.get();
    this._botReportingChannel = this._guildService.getChannel(
      Constants.Channels.Admin.BotLogs
    ) as TextChannel;
  }

  getEmbedAuthorData(message: IMessage | Interaction): MessageEmbedAuthor {
    const author = 'author' in message ? message.author : message.user;

    return {
      name: (message.member as GuildMember)?.displayName ?? '',
      iconURL: author.avatarURL() ?? '',
    };
  }

  getChannel(message: IMessage) {
    // Returns parent channel of a thread
    if (message.channel.isThread()) {
      return message.channel.parent as GuildChannel;
    }

    return message.channel as GuildChannel;
  }

  sendBotReport(payload: string | MessagePayload | MessageOptions) {
    this._sendConstructedReport(payload);
  }

  sendBotReportOnMessage(message: IMessage): Promise<IMessage> {
    let report = `New report on ${message.author} from ${message.channel}:\n`;
    if (message.content.length) {
      report += `\`\`\`${message.content.replace(/`/g, '')}\`\`\``;
    }
    report += `${this._linkPrefix}/${this._guild.id}/${message.channel.id}/${message.id}`;
    return this._sendConstructedReport({
      content: report,
      files: message.attachments.map((e) => e.url),
    });
  }

  attemptDMUser(message: IMessage, content: string | MessageEmbed) {
    return this.sendStringOrEmbed(message.author, content)
      .then(() => message.react('👍'))
      .catch(() => this.sendStringOrEmbed(message.channel as TextChannel, content));
  }

  async sendStringOrEmbed(destination: TextChannel | User, payload: string | MessageEmbed) {
    if (typeof payload === 'string') {
      return destination.send({ content: payload });
    }
    return destination.send({ embeds: [payload] });
  }

  async sendReactiveMessage(
    interaction: CommandInteraction,
    embedData: IInteractionEmbedData,
    lambda: Function,
    options: IReactionOptions
  ): Promise<IMessage> {
    const msg: IMessage = (await interaction.followUp({
      embeds: [embedData.embeddedMessage],
      components: [
        {
          type: 'ACTION_ROW',
          components: [
            ...embedData.emojiData.map((e) => e.buttonData),
            {
              type: 'BUTTON',
              style: 'SECONDARY',
              label: 'Cancel',
              customId: this._cancelCustomId,
            },
          ],
        },
      ],
      fetchReply: true,
      ephemeral: true,
    })) as IMessage;
    const minEmotes: number = embedData.emojiData.length - (options.reactionCutoff ?? 1);

    // Sets up the listener for buttons
    const collector = msg.createMessageComponentCollector({
      componentType: 'BUTTON',
      time: ms('2m'), // Listen for 2 Minutes
      filter: (i) =>
        (embedData.emojiData.some((e) => e.buttonData.customId === i.customId) ||
          i.customId === this._cancelCustomId) &&
        i.user.id === interaction.user.id,
    });

    // runs when a button is clicked
    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === this._cancelCustomId) {
        if (options.closingMessage) {
          if (typeof options.closingMessage === 'string') {
            await buttonInteraction.update({ content: options.closingMessage, components: [] });
          } else {
            await buttonInteraction.update({ ...options.closingMessage, components: [] });
          }
        } else {
          await buttonInteraction.update({ components: [], embeds: [], content: 'Cancelled' });
        }

        collector.stop();
        return;
      }

      const targetData = embedData.emojiData.find(
        (e) => e.buttonData.customId === buttonInteraction.customId
      );
      if (!targetData) {
        return;
      }

      try {
        // Runs the sent function, with the data pulled from the emoji key.
        lambda(targetData.args);

        // Removes the used emote to prevent it from running multiple times.
        embedData.emojiData = embedData.emojiData.filter(
          (e) => e.buttonData.customId !== buttonInteraction.customId
        );

        if (embedData.emojiData.length > minEmotes) {
          return;
        }

        if (options.cutoffMessage) {
          if (typeof options.cutoffMessage === 'string') {
            await buttonInteraction.update({ content: options.cutoffMessage, components: [] });
          } else {
            // @ts-ignore
            await buttonInteraction.update({ ...options.cutoffMessage, components: [] });
          }
        }

        collector.stop();
      } catch (e) {
        this._loggerService.warn(e);
      }
    });

    return msg;
  }

  async sendPagedEmbed(message: IMessage, _pages: MessageEmbed[]): Promise<IMessage> {
    const pages: MessageEmbed[] = _pages.map((e, i) =>
      e.setFooter(`Page ${i + 1} of ${_pages.length}`)
    );

    const msg: IMessage = await message.channel.send({ embeds: [pages[0]] });
    await Promise.all(this._ARROWS.map((a) => msg.react(a)));

    const collector = msg.createReactionCollector(
      {
        filter: (reaction: MessageReaction, user: User) =>
          this._ARROWS.includes(reaction.emoji.name!) && user.id !== msg.author.id, // Only run if its not the bot putting reacts
        time: 1000 * 60 * 10,
      } // Listen for 10 Minutes
    );

    let pageIndex = 0;
    collector.on('collect', async (reaction: MessageReaction) => {
      reaction.emoji.name === '➡️' ? pageIndex++ : pageIndex--;
      pageIndex = (pageIndex + pages.length) % pages.length; // Ensure pageIndex is in bounds

      await reaction.users
        .remove(reaction.users.cache.last()) // Decrement last reaction
        .then(async () => await msg.edit({ embeds: [pages[pageIndex]] }));
    });

    // Remove all reactions so user knows its no longer available
    collector.on('end', async () => {
      // Ensure message hasn't been deleted
      await msg.reactions.removeAll().catch(() => {});
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

  // Purpose of this is to get more than 100 messages
  // Which is the limit of the default fetch
  async fetchMessages(channel: TextChannel, limitParam: number) {
    let i: number;
    let last_id: Maybe<string>;
    const buffer: IMessage[] = [];

    // N-batches of 100
    for (i = 0; i < limitParam / 100; i++) {
      const config = { limit: 100, ...(last_id && { before: last_id }) }; // Optionally add last_id if it exists
      const batch = await channel.messages.fetch(config);
      // Make sure there are messages
      if (!batch.size) {
        continue;
      }

      const last = batch.last();
      if (last) {
        last_id = last.id; // Set id so we know where to start next batch
      }

      buffer.push(...[...batch.values()]);
    }
    return buffer;
  }

  private _sendConstructedReport(
    payload: string | MessagePayload | MessageOptions
  ): Promise<IMessage> {
    return this._botReportingChannel.send(payload);
  }
}
