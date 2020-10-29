import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { RichEmbed } from 'discord.js';

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
      this._handleListMarket(message);
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

  private async _handleListMarket(message: IMessage) {
    const itemsForSale = await this._fetchMessages(message, 300).catch((e) =>
      this.container.loggerService.error(e)
    );

    if (!itemsForSale) {
      return;
    }

    const embed = new RichEmbed();
    embed.setTitle('Items For Sale');
    embed.setColor('#7289da');
    embed.setDescription(itemsForSale.reverse().join('\n\n'));
    this._replyToUser(message, embed);
    message.delete();
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
    const itemsForSale: String[] = [];
    const buffer: Promise<String>[] = [];

    for (i = 0; i < limitParam / 100; i++) {
      const config = { limit: 100, before: last_id };
      const batch = await message.channel.fetchMessages(config);
      //Make sure there are messages
      if (!batch.array().length) {
        continue;
      }
      last_id = batch.last().id;

      const calls = batch.filter((msg) => this._startsWithPrefix(msg)); //Filter out non !market adds
      const parsed = calls.map((msg) => this._resolveToListing(msg)); //Turn them into listings
      parsed.forEach((e) => buffer.push(e));
    }

    await Promise.all(buffer).then((items) => {
      items.forEach((msg) => {
        itemsForSale.push(msg);
      });
    });
    return itemsForSale;
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
