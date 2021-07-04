import { HexColorString, MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';

enum QuoteType {
  Stock,
  Crypto,
}

export default class PricePlugin extends Plugin {
  public commandName: string = 'price';
  public name: string = 'Price Plugin';
  public description: string = 'Get financial quotes';
  public usage: string = 'price <ticker>; ex. price AAPL';
  public pluginAlias = ['crypto', 'stock'];

  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Finance;

  private _STOCK_API_URL: string = 'https://cloud.iexapis.com/stable';
  private _CRYPTO_API_URL: string = 'https://www.alphavantage.co/query?';
  private _ADVANCED_QUOTE_LINK: string = 'https://finance.yahoo.com/quote/';

  private _STONK_IMG = {
    up: {
      thumbnail_url:
        'https://www.netclipart.com/pp/m/59-594517_arrow-going-up-png-stock-market-graph-up.png',
      color: '#a3be8c' as HexColorString,
      direction: '+',
    },
    down: {
      thumbnail_url: 'https://claytrader.com/wp-content/uploads/2014/12/IMG_26122014_144211.png',
      color: '#bf616a' as HexColorString,
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
      if (stockQuote) {
        await message.channel.send({ embeds: [this._makeEmbed(stockQuote)] });
        continue;
      }

      const cryptoQuote = await this._queryCryptocurrency(ticker);
      if (cryptoQuote) {
        await message.channel.send({ embeds: [this._makeEmbed(cryptoQuote)] });
        continue;
      }

      bad_queries.push(ticker);
    }

    if (bad_queries.length > 0) {
      await message.reply(`Erroneous queries: \`${bad_queries.join(', ')}\``);
    }
  }

  private async _queryStock(ticker: string) {
    const call_url = `${this._STOCK_API_URL}/stock/${ticker}/quote?token=${process.env.STOCK_API_TOKEN}`;

    const data = await this.container.httpService
      .get(call_url)
      .then((res: IHttpResponse) => {
        return res.data;
      })
      .catch(() => {
        return {};
      });

    const wrapper = {
      symbol: ticker,
      change: data['changePercent'] * 100,
      price: data['latestPrice'],
      type: QuoteType.Stock,
      source: `${data['latestSource']} at ${data['latestTime']}`,
    };

    if (wrapper.price === undefined) {
      return undefined;
    }

    return wrapper;
  }

  private async _queryCryptocurrency(ticker: string) {
    const call_url =
      this._CRYPTO_API_URL +
      'function=DIGITAL_CURRENCY_DAILY' +
      '&symbol=' +
      ticker +
      '&market=USD' +
      '&apikey=' +
      process.env.CRYPTO_API_TOKEN;

    const data = await this.container.httpService
      .get(call_url)
      .then((res: IHttpResponse) => {
        return res.data;
      })
      .catch(() => {
        return new Object();
      });

    const realtime_call_url =
      this._CRYPTO_API_URL +
      'function=CURRENCY_EXCHANGE_RATE' +
      '&from_currency=' +
      ticker +
      '&to_currency=USD' +
      '&apikey=' +
      process.env.STOCK_API_TOKEN;

    const realtime_data = await this.container.httpService
      .get(realtime_call_url)
      .then((res: IHttpResponse) => {
        return res.data;
      })
      .catch(() => {
        return new Object();
      });

    const today = new Date();
    const today_format =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');

    // Crypto unavailable.
    if (
      !data['Meta Data'] ||
      !data['Time Series (Digital Currency Daily)']?.[today_format]?.['1a. open (USD)'] ||
      !realtime_data['Realtime Currency Exchange Rate']?.['5. Exchange Rate']
    ) {
      return null;
    }

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
      type: QuoteType.Crypto,
    };

    return wrapper;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _makeEmbed(quote: any) {
    const embed: MessageEmbed = new MessageEmbed();

    let direction = '';

    const colorThumbnailDirection =
      parseFloat(quote['change']) < 0 ? this._STONK_IMG.down : this._STONK_IMG.up;

    direction = colorThumbnailDirection.direction;
    embed.setColor(colorThumbnailDirection.color);
    embed.setThumbnail(colorThumbnailDirection.thumbnail_url);

    embed.setTitle(quote['symbol'].toUpperCase() + ' @ $' + quote['price']);
    embed.setFooter(quote.source || 'data from https://www.alphavantage.co/');

    embed.addField('Change', direction + this._formatNum(quote['change']) + '%', false);

    if (quote['type'] === QuoteType.Stock) {
      embed.setURL(this._ADVANCED_QUOTE_LINK + quote['symbol']);
    }

    return embed;
  }

  private _formatNum(num: string) {
    return parseFloat(num).toFixed(2);
  }
}
