import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { MessageEmbed, Message } from 'discord.js';

export default class MarketPlacePlugin extends Plugin {
  public commandName: string = 'marketplace';
  public name: string = 'MarketPlace';
  public description: string = 'Stores and Lists Everything On MarketPlace.';
  public usage: string = 'Market <add/list>';
  public pluginAlias = ['market'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.BuySellTrade;
  public commandPattern: RegExp = /(add\s.*|list)/;

  private _LISTING_PREFIX = '!marketplace add';
  private _ALIAS_PREFIX = '!market add';
  private _SOLD_EMOJI = '💰';
  private _MAX_CHAR_LENGTH = 2000;
  private _LINK_PREFIX: Maybe<string> = null;
  private _lastListingPost: Maybe<IMessage> = null;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [sub_command] = args;

    if (sub_command === 'add') {
      this._handleAddMarket(message);
      return;
    }
    if (sub_command === 'list') {
      await this._handleListMarket(message);
      return;
    }
  }

  private _handleAddMarket(message: IMessage) {
    this.container.messageService.attemptDMUser(
      message,
      {
        embeds: [
          new MessageEmbed().setDescription(
            `Your item has been added! Please react to your message with ${this._SOLD_EMOJI} once it is sold.`
          )
        ]
      }
    );
  }

  private async _handleListMarket(message: IMessage) {
    const oldMessages = await this._fetchMessages(message, 300);
    const itemsForSale = this._fetchListings(oldMessages);

    const chunks = [];
    while (itemsForSale.length > 0) {
      let curLength = 0;
      const temp = [];

      while (
        itemsForSale.length &&
        curLength + itemsForSale[itemsForSale.length - 1].length < this._MAX_CHAR_LENGTH
      ) {
        temp.push(itemsForSale.pop() as string);
        curLength = temp.join('').length;
      }

      chunks.push(temp.reverse());
    }

    const pages: MessageEmbed[] = this._createListingEmbed(chunks);
    await this.container.messageService
      .sendPagedEmbed(message, pages)
      .then(async (sentMsg) => await this._deleteOldListingPost(message, sentMsg));
    await message.delete();
  }

  private _createListingEmbed(chunks: string[][]): MessageEmbed[] {
    return chunks.map((items) => {
      const embed = new MessageEmbed();
      embed.setTitle('Items For Sale');
      embed.setColor('#7289da');
      embed.setDescription(items.reverse().join('\n\n'));
      return embed;
    });
  }

  private async _deleteOldListingPost(listCall: IMessage, newPosting: IMessage) {
    // .get To make sure the message wasnt deleted already
    if (this._lastListingPost && listCall.channel.messages.cache.get(this._lastListingPost.id)) {
      await this._lastListingPost.delete();
      this._lastListingPost = newPosting;
      return;
    }

    await this._fetchMessages(listCall, 100).then((messages) => {
      const botMsgs = messages.filter(
        (msg) =>
          msg.author.bot && // From bot
          msg.embeds.length && // Contains an embed
          newPosting.id !== msg.id // Not the new listing
      );
      if (botMsgs.length === 0) {
        return;
      }

      this._lastListingPost = botMsgs[0];
    });

    // It's possible to have not posted a list in the last 100 messages
    if (!this._lastListingPost) {
      this._lastListingPost = newPosting;
      return;
    }

    await this._lastListingPost.delete();
    this._lastListingPost = newPosting;
  }

  private async _fetchMessages(message: IMessage, limitParam: number) {
    let i: number;
    let last_id = message.id;
    const buffer: Message[] = [];

    for (i = 0; i < limitParam / 100; i++) {
      const config = { limit: 100, before: last_id };
      const batch = await message.channel.messages.fetch(config);
      // Make sure there are messages
      if (!batch.size) {
        continue;
      }

      const last = batch.last();
      if (last) {
        last_id = last.id;
      }

      buffer.push(...batch.array());
    }
    return buffer;
  }

  private _fetchListings(messages: Message[]): string[] {
    const calls = messages.filter(
      (msg) =>
        (msg.content.startsWith(this._LISTING_PREFIX) || // Filter out non !market adds
          msg.content.startsWith(this._ALIAS_PREFIX)) &&
        !Boolean(msg.reactions.cache.find((r) => r.emoji.name === this._SOLD_EMOJI)) // Filter out sold listings
    );

    return calls.reduce((acc: string[], msg) => {
      const parsed = this._resolveToListing(msg);
      if (parsed) {
        acc.push(parsed);
      }

      return acc;
    }, []);
  }

  private _resolveToListing(msg: IMessage): Maybe<string> {
    const { content } = msg;
    const [, item] = content.split('add');

    if (!item?.length) {
      return '';
      /* The messages are already filtered before this function is called
      So this should theoretically never be true*/
    }

    const user = msg.author;
    const isInServer = Boolean(this.container.guildService.get().members.cache.get(user.id));
    if (!isInServer) {
      return;
    }

    return `${item}\n ${user.toString()} [Link](${this._getLinkPrefix() + msg.id})`;
  }

  private _getLinkPrefix() {
    if (this._LINK_PREFIX) {
      return this._LINK_PREFIX;
    }

    const guildID = this.container.guildService.get().id;
    const chanID = this.container.guildService.getChannel(Constants.Channels.Public.BuySellTrade)
      .id;
    this._LINK_PREFIX = `https://discord.com/channels/${guildID}/${chanID}/`;
    return this._LINK_PREFIX;
  }
}
