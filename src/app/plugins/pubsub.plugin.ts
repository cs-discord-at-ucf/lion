import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';
import { GuildEmoji, MessageEmbed } from 'discord.js';
import * as moment from 'moment';
import { PricePlugin } from './price.plugin';

export class PubSubPlugin extends Plugin {
  public name: string = 'Pub Sub Plugin';
  public description: string = 'Get prices and steamy pictures of the subs you need in your life.';
  public usage: string = 'pubSub <subName (optional)> | <"list" | "types" (optional)>';
  public pluginAlias = ['sub', 'subs', 'sandwich', 'samwich', 'sarnie'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Food;

  private _API_URL: string = 'https://api.pubsub-api.dev';
  private _VALID_KEYS: string[] = ['random', 'list', 'types', ''];
  private _DEFAULT_INPUT: string = 'chicken-tenders';
  private _SUBS: string[] = [];
  private _EMBED_LIST = new MessageEmbed();

  private _PUB_SUB_EMOJI: GuildEmoji | string = '';
  private _SUB_UPD_THRESH: number = moment.duration(1, 'days').asMilliseconds();
  private _LAST_UPD_TIME: number = 0;

  constructor(public container: IContainer) {
    super();
    this._updateData();
  }

  private async _updateData() {
    this.container.httpService
      .get(`${this._API_URL}/allsubs/`)
      .then((response: IHttpResponse) => {
        const subs = response.data;

        this._SUBS = subs.map((subData: { name: string }) => subData.name);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    const input = (args || []).join('-').toLowerCase() || this._DEFAULT_INPUT;
    this._PUB_SUB_EMOJI =
      message?.guild?.emojis.cache.filter((e) => e.name === 'pubsub').first() || '🥪';

    if (input === 'list' || input === 'types') {
      // Simply return the list of supported subs
      message.reply(await this._generateEmbedList());
      return;
    }

    // checks that the user entered a sub, otherwise it gets random
    const subType = this._SUBS.find((sub: string) => sub === input) || 'random';

    // recieves the according info and posts, or derps
    await this.container.httpService
      .get(`${this._API_URL}/subs/?name=${subType}`)
      .then((response: IHttpResponse) => {
        const [subData] = response.data;
        const embed: MessageEmbed = this._generateEmbedSub(this._parseSub(subData));

        message.reply(embed);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  private async _generateEmbedList(): Promise<MessageEmbed> {
    const lastListUpdate: number = Date.now() - this._LAST_UPD_TIME;

    if (lastListUpdate < this._SUB_UPD_THRESH) {
      return this._EMBED_LIST;
    }

    this._LAST_UPD_TIME = Date.now(); // since it only updates once a day, don't need to worry about accuracy

    await this._updateData();

    // setting up number of columns and rows for the list
    const maxCol = 3;
    const maxRows = 10; // this only states when a new row starts, it can go higher than this
    const numCols = Math.min(maxCol, Math.ceil(this._SUBS.length / maxRows));
    const numRows = Math.ceil(this._SUBS.length / numCols);

    // sets up a new embed for the list to reside in
    this._EMBED_LIST = new MessageEmbed();
    this._EMBED_LIST.setColor('#0099ff').setTitle('Types of Subs');
    const subs = this._SUBS.map((sub) => this._normalizeName(sub));

    const res = new Array(numCols).fill(0).map((_) => subs.splice(0, numRows));

    // cycles through each column inserting their row, and also notes the alphabetic range
    res.forEach((columnSubs) => {
      this._EMBED_LIST.addField(
        `${columnSubs[0].charAt(0)} - ${columnSubs[columnSubs.length - 1].charAt(0)}`,
        columnSubs.join('\n'),
        true
      );
    });

    return this._EMBED_LIST;
  }

  private _generateEmbedSub(subData: subData): MessageEmbed {
    console.log('test');
    console.log(subData);
    const embed: MessageEmbed = new MessageEmbed();

    // defaults to not on sale
    let saleInfo =
      `it **isn't** on sale currently 😭, but who could say no to ${subData.price}.` +
      ` The last time it was on sale was ${subData.saleDates}`;

    // status is true if the sub is on sale
    if (subData.onSale) {
      saleInfo = `it **is** on sale for ${subData.price} 🥳, until ${subData.endSaleDate}`;
    }

    embed.setColor('#0099ff').setTitle(subData.name + ' sub');

    embed.setDescription(
      `Get your own *${subData.name}* sub, ${saleInfo}.` +
        ` So what are you waiting for?  Come on down to Publix now to get yourself a beautiful sub.` +
        ` Just look at this beauty right here! ` +
        `😍😍😍${this._PUB_SUB_EMOJI}${this._PUB_SUB_EMOJI}${this._PUB_SUB_EMOJI}🤤🤤🤤`
    );

    embed.setImage(subData.image);

    embed.setFooter(`pulled from: pubsub-api.dev.`);

    return embed;
  }

  private _parseSub(subData: any): subData {
    const name = this._normalizeName(subData.sub_name) || 'Nothing Found';
    const onSale = subData.status.toLowerCase() === 'true';
    const dates = subData.last_sale || ' - ';
    const image = subData.image || '';
    const price = subData.price || '';

    const [startDate, endDate, _] = dates.split('-');
    console.log('test');

    return {
      image: image,
      name: name,
      price: price,
      onSale: onSale,
      saleDates: dates,
      startDate: startDate,
      endSaleDate: endDate,
    };
  }

  public validate(message: IMessage, args?: string[]) {
    const input = (args || []).join('-').toLowerCase();

    const hasKeyword: boolean = this._VALID_KEYS.includes(input);
    const hasSub: boolean = this._SUBS.includes(input);

    return hasSub || hasKeyword;
  }

  private _normalizeName(input: string): string {
    return input
      .replace(/-/g, ' ') // adds spaces
      .replace(/\b\w/g, (l: string) => l.toUpperCase()); // adds capitalization
  }
}

interface subData {
  image: string;
  name: string;
  price: string;
  onSale: boolean;
  saleDates: string;
  startDate: string;
  endSaleDate: string;
}
