import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { RichEmbed, Message } from 'discord.js';

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
  private _lastListingPost: Maybe<IMessage> = undefined;

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
      this._handleListMarket(message, itemBeingSold?.toLowerCase() === 'dm');
    } else {
      message.reply('Invalid command. See !help');
    }
  }

  private _handleAddMarket(message: IMessage, description: string) {
    const stringForUser = description
      ? 'Your item has been added! Please delete your message once it is sold.'
      : 'Invalid Listing.';
    const embed = new RichEmbed();
    embed.setDescription(stringForUser);
    this._replyToUser(message, embed);
  }

  private async _handleListMarket(message: IMessage, shouldDmUser: boolean) {
    const oldMessages = await this._fetchMessages(message, 300);
    const itemsForSale = await this._fetchListings(oldMessages);

    const embed = new RichEmbed();
    embed.setTitle('Items For Sale');
    embed.setColor('#7289da');
    embed.setDescription(itemsForSale.reverse().join('\n\n'));

    await message.channel
      .send(embed)
      .then(async (sentMsg) => await this._deleteOldListingPost(message, sentMsg as Message));
    if (shouldDmUser) {
      this._replyToUser(message, embed);
    }
    await message.delete();
  }

  private async _deleteOldListingPost(listCall: IMessage, newPosting: IMessage) {
    //.get To make sure the message wasnt deleted already
    if (this._lastListingPost && listCall.channel.messages.get(this._lastListingPost.id)) {
      await this._lastListingPost.delete().catch();
      this._lastListingPost = newPosting;
      return;
    }

    await this._fetchMessages(listCall, 100).then((messages) => {
      [this._lastListingPost] = messages.filter((msg) => msg.author.bot && msg.id != newPosting.id);
    });

    //It's possible to have not posted a list in the last 100 messages
    if (!this._lastListingPost) {
      this._lastListingPost = newPosting;
      return;
    }

    this._lastListingPost.delete();
    this._lastListingPost = newPosting;
  }

  private async _replyToUser(message: IMessage, embed: RichEmbed) {
    try {
      await message.author.send(embed);
    } catch (e) {
      await message.reply(embed);
    }
  }

  private async _fetchMessages(message: IMessage, limitParam: number) {
    let i: number;
    let last_id = message.id;
    const buffer: Message[] = [];

    for (i = 0; i < limitParam / 100; i++) {
      const config = { limit: 100, before: last_id };
      const batch = await message.channel.fetchMessages(config);
      //Make sure there are messages
      if (!batch.size) {
        continue;
      }
      last_id = batch.last().id;

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
    const hasTargetReaction = msg.reactions.find((r) => r.emoji.name === this._TARGET_REACTION);
    if (!hasTargetReaction) {
      return item;
    }

    const users = await hasTargetReaction.fetchUsers();
    if (users.has(msg.author.id)) {
      item += '\t SOLD';
    }
    return item;
  }
}
