import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';
import Environment from '../../environment';
import { RichEmbed } from 'discord.js';

export class StockPlugin extends Plugin {
  public name: string = 'Stock Plugin';
  public description: string = 'Get stock quotes';
  public usage: string = 'stock <ticker>; stock AAPL';
  public permission: ChannelType = ChannelType.Public;

  private _API_URL: string = 'https://www.alphavantage.co/query?';
  private _ADVANCED_QUOTE_LINK: string = 'https://finance.yahoo.com/quote/';

  private _STONK_IMG = {
    up: {
      thumbnail_url:
        'https://www.netclipart.com/pp/m/59-594517_arrow-going-up-png-stock-market-graph-up.png',
      color: '#00ff00',
      direction: '+',
    },
    down: {
      thumbnail_url: 'https://claytrader.com/wp-content/uploads/2014/12/IMG_26122014_144211.png',
      color: '#ff0000',
      direction: '', // no direction needed because floatToString will add `-`
    },
  };

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    // in order to error handle
    return args.length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const bad_queries: string[] = [];

    for (const ticker of args) {
      const stockQuote = await this._queryStock(ticker);
      const cryptoQuote = await this._queryCryptocurrency(ticker);
      if (!stockQuote && !cryptoQuote) {
        bad_queries.push(ticker);
        continue;
      }

      if (stockQuote) {
        message.channel.send(this._makeEmbed(stockQuote));
      } else {
        message.channel.send(this._makeCryptoEmbed(cryptoQuote));
      }
    }

    if (bad_queries.length > 0) {
      message.reply(`Erroneous queries: \`${bad_queries.join(', ')}\``);
    }
  }

  private async _queryStock(ticker: string) {
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
        return new Object();
      });

    const quote = data['Global Quote'];

    return quote;
  }

  private async _queryCryptocurrency(ticker: string) {
    const call_url =
      this._API_URL +
      'function=DIGITAL_CURRENCY_DAILY' +
      '&symbol=' +
      ticker +
      '&market=USD' +
      '&apikey=' +
      Environment.StockApiToken;

    const data = await this.container.httpService
      .get(call_url)
      .then((res: IHttpResponse) => {
        return res.data;
      })
      .catch((err) => {
        return new Object();
      });

    const realtime_call_url =
      this._API_URL +
      'function=CURRENCY_EXCHANGE_RATE' +
      '&from_currency=' +
      ticker +
      '&to_currency=USD' +
      '&apikey=' +
      Environment.StockApiToken;

    const realtime_data = await this.container.httpService
      .get(realtime_call_url)
      .then((res: IHttpResponse) => {
        return res.data;
      })
      .catch((err) => {
        return new Object();
      });

    // Crypto unavailable.
    if (!data['Meta Data']) {
      return null;
    }

    const today = new Date();
    const today_format =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');

    console.log(realtime_call_url);

    const open = parseFloat(
      data['Time Series (Digital Currency Daily)'][today_format]['1a. open (USD)']
    );

    const current = parseFloat(
      realtime_data['Realtime Currency Exchange Rate']['5. Exchange Rate']
    );

    const wrapper = {
      symbol: ticker,
      change: (current - open) / open,
      price: current,
    };

    return wrapper;
  }

  private _makeEmbed(quote: any) {
    const embed: RichEmbed = new RichEmbed();

    let direction = '';

    const colorThumbnailDirection =
      parseFloat(quote['09. change']) < 0 ? this._STONK_IMG.down : this._STONK_IMG.up;

    direction = colorThumbnailDirection.direction;
    embed.setColor(colorThumbnailDirection.color);
    embed.setThumbnail(colorThumbnailDirection.thumbnail_url);

    embed.setTitle(quote['01. symbol'] + ' @ ' + quote['05. price']);
    embed.setFooter('data from https://www.alphavantage.co/');

    embed.addField('Change', direction + this._formatNum(quote['10. change percent']) + '%', false);

    embed.setTimestamp(new Date());

    embed.setURL(this._ADVANCED_QUOTE_LINK + quote['01. symbol']);

    return embed;
  }

  private _makeCryptoEmbed(quote: any) {
    const embed: RichEmbed = new RichEmbed();

    let direction = '';

    const colorThumbnailDirection =
      parseFloat(quote['change']) < 0 ? this._STONK_IMG.down : this._STONK_IMG.up;

    direction = colorThumbnailDirection.direction;
    embed.setColor(colorThumbnailDirection.color);
    embed.setThumbnail(colorThumbnailDirection.thumbnail_url);

    embed.setTitle(quote['symbol'].toUpperCase() + ' @ ' + quote['price']);
    embed.setFooter('data from https://www.alphavantage.co/');

    embed.addField('Change', direction + this._formatNum(quote['change']) + '%', false);

    embed.setTimestamp(new Date());

    return embed;
  }

  private _formatNum(num: string) {
    return parseFloat(num).toFixed(2);
  }
}
