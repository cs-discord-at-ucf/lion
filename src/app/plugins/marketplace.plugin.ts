import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { RichEmbed } from 'discord.js';

export class MarketPlacePlugin extends Plugin {
  public name: string = 'MarketPlace';
  public description: string = 'Stores and Lists Everything On MarketPlace.';
  public usage: string = '!Market <add/list>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.BuySellTrade;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    if (!args || args.length === 0) {
      message.reply('Invalid syntax.');
      return;
    }

    const [sub_command] = args; //set sub command = args[0].
    const description = message.content.slice(17); //everything after the first 17 letters is the listing.

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
    message.channel.fetchMessages({ limit: 100 }).then((msgs) => {
      const itemsForSale: String[] = [];

      //iterate over messages.
      msgs.forEach(function(msg) {
        const content = msg.content;

        if (content.includes('!marketplace add')) {
          let item = content.slice(17); //everything after the first 17 letters is the listing.
          if (item !== '') {
            const user = msg.author;
            item += '\n' + user; //adds user to end of listing.
            itemsForSale.unshift(item);
          }
        }
      });

      const embed = new RichEmbed();
      embed.setTitle('Items For Sale');
      embed.setColor('#7289da');
      embed.setDescription(itemsForSale.join('\n\n'));
      this._replyToUser(message, embed);
    });
  }

  private async _replyToUser(message: IMessage, embed: RichEmbed) {
    try {
      await message.author.send(embed);
    } catch (e) {
      await message.reply(embed);
    }
  }
}
