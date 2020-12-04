import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { RichEmbed, Message } from 'discord.js';

export class MarketPlacePlugin extends Plugin {
  public name: string = 'MarketPlace';
  public description: string = 'Stores and Lists Everything On MarketPlace.';
  public usage: string = 'Market <add/list>';
  public pluginAlias = ['market'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.BuySellTrade;
  private _NEW_LISTING_PREFIX = 'marketplace add';
  private _GET_LISTING_PREFIX = 'marketplace list';
  private _NEW_ALIAS_PREFIX = 'market add';
  private _TARGET_REACTION = '💰';

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

    const [sub_command, description] = args; //set sub command = args[0].

    if (sub_command === 'add') {
      this._handleAddMarket(message, description);
    } else if (sub_command === 'list') {
      this._handleListMarket(message, description?.toLowerCase() === 'dm');
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
    const oldMessages = await this._fetchMesages(message, 300);
    const itemsForSale = await this._fetchListings(oldMessages);
    this._deleteOldListingPosts(oldMessages);

    const embed = new RichEmbed();
    embed.setTitle('Items For Sale');
    embed.setColor('#7289da');
    embed.setDescription(itemsForSale.reverse().join('\n\n'));

    message.channel.send(embed);
    if (shouldDmUser) {
      this._replyToUser(message, embed);
    }
    message.delete();
  }

  private _deleteOldListingPosts(messages: Message[]) {
    messages.forEach((msg: IMessage) => {
      if (msg.author.bot) {
        msg.delete();
      }
    });
  }

  private async _replyToUser(message: IMessage, embed: RichEmbed) {
    try {
      await message.author.send(embed);
    } catch (e) {
      await message.reply(embed);
    }
  }

  private async _fetchMesages(message: IMessage, limitParam: number) {
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
    const calls = messages.filter((msg) => this._startsWithPrefix(msg)); //Filter out non !market adds
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
    item += '\n' + user; //adds user to end of listing.

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

  private _startsWithPrefix(msg: IMessage): boolean {
    const { content } = msg;
    const startsWithPrefix = [this._NEW_LISTING_PREFIX, this._NEW_ALIAS_PREFIX]
      .map((e) => content.indexOf(e))
      .some((e) => e === 1);

    return startsWithPrefix;
  }
}
