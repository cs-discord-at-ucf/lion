import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';
import { Guild, MessageEmbed } from 'discord.js';
import * as moment from 'moment';

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
        if (Math.floor(response.status / 100) != 2) {
          message.reply('The API seems to be having some issues at this time.');
          return;
        }

        const [subData] = response.data;
        const embed: MessageEmbed = this._generateEmbedSub(this._parseSub(subData), message.guild);

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

    this._EMBED_LIST.addField('Available Subs', this._SUBS.join('\n'));

    return this._EMBED_LIST;
  }

  private _generateEmbedSub(subData: subData, guild: Guild | null): MessageEmbed {
    const embed: MessageEmbed = new MessageEmbed();
    const pubSubEmoji = guild?.emojis.cache.filter((e) => e.name === 'pubsub').first() || '🥪';

    // defaults to not on sale
    let saleInfo =
      `it **isn't** on sale currently 😭, but who could say no to ${subData.price}.` +
      ` The last time it was on sale was ${subData.last_sale}`;

    // status is true if the sub is on sale
    if (subData.status) {
      saleInfo = `it **is** on sale for ${subData.price} 🥳, until ${subData.last_sale_end}`;
    }

    embed.setColor('#0099ff').setTitle(subData.sub_name + ' sub');

    embed.setDescription(
      `Get your own *${subData.sub_name}* sub, ${saleInfo}.` +
        ` So what are you waiting for?  Come on down to Publix now to get yourself a beautiful sub.` +
        ` Just look at this beauty right here! ` +
        `😍😍😍${pubSubEmoji}${pubSubEmoji}${pubSubEmoji}🤤🤤🤤`
    );

    embed.setImage(subData.image);

    embed.setFooter(`pulled from: pubsub-api.dev.`);

    return embed;
  }

  private _parseSub(subData: any): subData {
    subData.name = this._normalizeName(subData.sub_name) || 'Nothing Found';
    subData.onSale = subData.status.toLowerCase() === 'true';
    subData.last_sale = subData.last_sale || ' - ';
    subData.image = subData.image || '';
    subData.price = subData.price || '';

    [, subData.last_sale_end] = subData.last_sale.split('-');
    return subData;
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
  sub_name: string;
  price: string;
  status: boolean;
  last_sale: string;
  last_sale_end: string;
}
