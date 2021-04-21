import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export class PubSubPlugin extends Plugin {
  public name: string = 'Pub Sub Plugin';
  public description: string = 'Get prices and steamy pictures of the subs you need in your life.';
  public usage: string = 'pubSub <subName (optional)> | <"list" | "types" (optional)>';
  public pluginAlias = ['sub', 'subs', 'sandwich', 'samwich', 'sarnie'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Food;

  private _API_URL: string = 'https://api.pubsub-api.dev';
  private _VALID_KEYS: string[] = ['random', 'list', 'types', ''];
  private _SUBS: string[] = [];
  private _EMBED_LIST = new MessageEmbed();

  private _SUB_UPD_THRESH: number = 1000 * 60 * 60 * 24; // in ms, one day.
  private _LAST_UPD_TIME: number = -this._SUB_UPD_THRESH - 1;

  constructor(public container: IContainer) {
    super();
    this._updateList();
  }

  private _updateList() {
    this.container.httpService
      .get(`${this._API_URL}/allsubs/`)
      .then((response: IHttpResponse) => {
        const subs = response.data;

        this._SUBS = subs.map((subData: { name: string }) => subData.name);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    const subIn = this._parseInput(args || []);

    // return the og message
    if (!subIn) {
      const state = this.container.storeService.get('pubSubStore').state;
      if (state?.onSale) {
        message.reply('Chicken tender subs are on sale :eyes:');
      } else {
        message.reply('Chicken tender subs are **NOT** on sale.');
      }
      return;
    }

    if (subIn === 'list' || subIn === 'types') {
      //Simply return the list of supported subs
      this._generateEmbedList();
      message.reply(this._EMBED_LIST);
      return;
    }

    // checks if their sub was a sub, then if that sub is recognised
    const subType = this._SUBS.find((sub: string) => sub === subIn) || 'random';

    //recieves the according info and posts, or derps
    await this.container.httpService
      .get(`${this._API_URL}/subs/?name=${subType}`)
      .then((response: IHttpResponse) => {
        const [subData] = response.data;
        const embed = new MessageEmbed();

        const parsedNamed = this._normaliseName(subData.sub_name);
        const saleInfo =
          subData.status.toLowerCase() === 'true' //a function would be too shallow to warrant making
            ? `for the discounted price of ${subData.price} until ${
                subData.last_sale.split('-')[1]
              }`
            : `it isn't on sale currently, but who could say no to ${subData.price}.  The last time it was on sale was ${subData.last_sale}`;

        embed.setColor('#0099ff').setTitle(parsedNamed);

        embed.setDescription(
          `Get your own *${parsedNamed}* sub, ${saleInfo}. So what are you waiting for?  Come on down to Publix now to get yourself a beautiful sub. Just look at this beauty right here! 😍😍😍:pubsub::pubsub::pubsub:🤤🤤🤤` +
            `\n\n *pulled from https://pubsub-api.dev.*`
        );

        embed.setImage(subData.image);

        message.reply(embed);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  private async _generateEmbedList(): Promise<void> {
    const lastListUpdate: number = Date.now() - this._LAST_UPD_TIME;
    if (lastListUpdate < this._SUB_UPD_THRESH) {
      return;
    }

    this._LAST_UPD_TIME = Date.now(); //since it only updates once a day, don't need to worry about accuracy

    this._updateList();

    const numCols = Math.min(3, Math.ceil(this._SUBS.length / 10));
    const numRows = Math.ceil(this._SUBS.length / numCols);

    this._EMBED_LIST = new MessageEmbed();

    this._EMBED_LIST.setColor('#0099ff').setTitle('Types of Subs');
    const subs = this._SUBS.map((sub) => this._normaliseName(sub));

    for (let cols = 0; cols < numCols; cols++) {
      const columnSubs = subs.slice(numRows * cols, numRows * (cols + 1));

      this._EMBED_LIST.addField(
        `${columnSubs[0].charAt(0)} - ${columnSubs[columnSubs.length - 1].charAt(0)}`,
        columnSubs.join('\n'),
        true
      );
    }
  }

  public validate(message: IMessage, args?: string[]) {
    const subIn = this._parseInput(args || []);

    const keywordCheck: boolean = this._VALID_KEYS.indexOf(subIn) != -1;
    const subTypeCheck: boolean = this._SUBS.indexOf(subIn) != -1;

    return subTypeCheck || keywordCheck;
  }

  private _parseInput(args: string[]): string {
    return args.join('-').toLowerCase();
  }

  private _normaliseName(input: string): string {
    return input
      .replace(/-/g, ' ') // adds spaces
      .replace(/\b\w/g, (l: string) => l.toUpperCase()); // adds capitalization
  }
}
