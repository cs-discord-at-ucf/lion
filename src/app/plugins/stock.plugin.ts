import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';
import Constants from '../../common/constants';
import { TextChannel, RichEmbed } from 'discord.js';
import Environment from '../../environment';
import { parse } from 'querystring';

export class StockPlugin extends Plugin {
  public name: string = 'Stock Plugin';
  public description: string = 'Get stock quotes';
  public usage: string = 'stock <ticker>; stock AAPL';
  public permission: ChannelType = ChannelType.Public;

  private _API_URL: string = 'https://www.alphavantage.co/query?';
  private _ADVANCED_QUOTE_LINK: string = 'https://finance.yahoo.com/quote/';

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    // in order to error handle
    return args.length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    if (!args || args.length < 1) message.reply('Bad query.');

    const ticker = args[0];

    const call_url =
      this._API_URL +
      'function=GLOBAL_QUOTE' +
      '&symbol=' +
      ticker +
      '&apikey=' +
      Environment.StockApiToken;

    const data = await this.container.httpService
      .get(call_url)
      .then((res: IHttpResponse) => {
        return res.data;
      })
      .catch((err) => {
        console.log(err);
        return new Object();
      });

    const quote = data['Global Quote'];

    if (!quote) {
      console.error('Query of ' + args.join(' ') + ' got ' + data);
      message.reply('Query of `' + args.join(' ') + '` resulted in an error.');
      return;
    }

    console.log(quote);

    const embed: RichEmbed = new RichEmbed();

    let direction = '';

    if (parseFloat(quote['09. change']) < 0) {
      // if stock is down
      embed.setColor('#ff0000');
      embed.setThumbnail(
        'https://claytrader.com/wp-content/uploads/2014/12/IMG_26122014_144211.png'
      );
    } else {
      direction = '+';
      // if stock is up
      embed.setColor('#00ff00');
      embed.setThumbnail(
        'https://www.netclipart.com/pp/m/59-594517_arrow-going-up-png-stock-market-graph-up.png'
      );
    }

    embed.setTitle(quote['01. symbol'] + ' @ ' + quote['05. price']);
    embed.setFooter('data from https://www.alphavantage.co/');

    embed.addField('Change', direction + this._formatNum(quote['10. change percent']) + '%', false);

    if (args[1] == '-ohl') {
      embed.addField('Open', this._formatNum(quote['02. open']), true);
      embed.addField('Low', this._formatNum(quote['04. low']), true);
      embed.addField('High', this._formatNum(quote['03. high']), true);
    }

    embed.setTimestamp(new Date());

    embed.setURL(this._ADVANCED_QUOTE_LINK + quote['01. symbol']);

    message.channel.send(embed);
  }

  private _formatNum(num: string) {
    return parseFloat(num).toFixed(2);
  }
}
