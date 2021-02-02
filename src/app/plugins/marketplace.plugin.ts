import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { MessageEmbed, Message } from 'discord.js';

export class MarketPlacePlugin extends Plugin {
  public name: string = 'MarketPlace';
  public description: string = 'Stores and Lists Everything On MarketPlace.';
  public usage: string = 'Market <add/list>';
  public pluginAlias = ['market'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.BuySellTrade;

  private _LISTING_PREFIX = '!marketplace add';
  private _ALIAS_PREFIX = '!market add';
  private _TARGET_REACTION = '💰';
  private _MAX_CHAR_LENGTH = 2000;
  private _lastListingPost: Maybe<IMessage> = null;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    if (!args || args.length === 0) {
      message.reply('Invalid syntax.');
      return;
    }

    const [sub_command, itemBeingSold] = args;

    if (sub_command === 'add') {
      this._handleAddMarket(message, itemBeingSold);
    } else if (sub_command === 'list') {
      this._handleListMarket(message);
    } else {
      message.reply('Invalid command. See !help');
    }
  }

  private _handleAddMarket(message: IMessage, description: string) {
    const stringForUser = description
      ? `Your item has been added! Please react to your message with ${this._TARGET_REACTION} once it is sold.`
      : 'Invalid Listing.';
    const embed = new MessageEmbed();
    embed.setDescription(stringForUser);
    this.container.messageService.attempDMUser(message, embed);
  }

  private async _handleListMarket(message: IMessage) {
    const oldMessages = await this._fetchMessages(message, 300);
    const itemsForSale = await this._fetchListings(oldMessages);

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
    return chunks.map((items, i) => {
      const embed = new MessageEmbed();
      embed.setTitle('Items For Sale');
      embed.setColor('#7289da');
      embed.setDescription(items.reverse().join('\n\n'));
      embed.setFooter(`Page ${i + 1} of ${chunks.length}`);
      return embed;
    });
  }

  private async _deleteOldListingPost(listCall: IMessage, newPosting: IMessage) {
    //.get To make sure the message wasnt deleted already
    if (this._lastListingPost && listCall.channel.messages.cache.get(this._lastListingPost.id)) {
      await this._lastListingPost.delete();
      this._lastListingPost = newPosting;
      return;
    }

    await this._fetchMessages(listCall, 100).then((messages) => {
      const botMsgs = messages.filter(
        //Make sure it isnt one of the newest postings
        (msg) => msg.author.bot && newPosting.id != msg.id
      );
      if (botMsgs.length === 0) {
        return;
      }

      this._lastListingPost = botMsgs[0];
    });

    //It's possible to have not posted a list in the last 100 messages
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
      //Make sure there are messages
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

  private async _fetchListings(messages: Message[]): Promise<string[]> {
    const calls = messages.filter(
      (msg) =>
        msg.content.startsWith(this._LISTING_PREFIX) || msg.content.startsWith(this._ALIAS_PREFIX)
    ); //Filter out non !market adds
    const parsed = calls.map((msg) => this._resolveToListing(msg)); //Turn them into listings
    return await Promise.all(parsed);
  }

  private async _resolveToListing(msg: IMessage) {
    const { content } = msg;
    let [, item] = content.split('add');

    if (!item?.length) {
      return '';
      /*The messages are already filtered before this function is called
      So this should theoretically never be true*/
    }

    const user = msg.author;
    item += '\n' + user.toString(); //adds user to end of listing.

    //Check if sold
    const hasTargetReaction = msg.reactions.cache.find(
      (r) => r.emoji.name === this._TARGET_REACTION
    );
    if (!hasTargetReaction) {
      return item;
    }

    const users = await hasTargetReaction.users.fetch();
    if (users.has(msg.author.id)) {
      item += '\t SOLD';
    }
    return item;
  }
}
