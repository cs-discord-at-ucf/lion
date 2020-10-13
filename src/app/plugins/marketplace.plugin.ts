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
    this._parseMessage(args);

    const [sub_command] = args; //set sub command = args[0].
    const description = message.content.slice(this._NEW_LISTING_PREFIX.length + 2);

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

  private _handleListMarket(message: IMessage) {
    try {
      message.channel.fetchMessages({ limit: 100 }).then((msgs) => {
        const itemsForSale: String[] = [];

        //iterate over messages.
        msgs.forEach((msg) => {
          const { content } = msg;

          //If content does not contains either element of array then stop.
          if (
            ![this._NEW_LISTING_PREFIX, this._NEW_ALIAS_PREFIX].some((el) => content.includes(el))
          ) {
            return;
          }

          let [_, item] = content.split('add');
          if (item?.length) {
            const user = msg.author;
            item += '\n' + user; //adds user to end of listing.
            itemsForSale.push(item);
          }
        });

        const embed = new RichEmbed();
        embed.setTitle('Items For Sale');
        embed.setColor('#7289da');
        embed.setDescription(itemsForSale.reverse().join('\n\n'));
        this._replyToUser(message, embed);
      });
    } catch (e) {
      this.container.loggerService.error(e);
    }
  }

  private async _replyToUser(message: IMessage, embed: RichEmbed) {
    try {
      await message.author.send(embed);
    } catch (e) {
      await message.reply(embed);
    }
  }
  private _parseMessage(args: string[]) {
    console.log(args);
  }
}
