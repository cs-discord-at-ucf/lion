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
  private _DEFAULT_INPUT: string = 'chicken-tenders';
  private _SUBS: string[] = [];
  private _EMBED_LIST = new MessageEmbed();

  private _SUB_UPD_THRESH: number = 1000 * 60 * 60 * 24; // in ms, one day.
  private _LAST_UPD_TIME: number = 0;

  constructor(public container: IContainer) {
    super();
    this._updateList();
  }

  private async _updateList() {
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
      //Simply return the list of supported subs
      await this._generateEmbedList();
      message.reply(this._EMBED_LIST);
      return;
    }

    // checks if their sub was a sub, then if that sub is recognised
    const subType = this._SUBS.find((sub: string) => sub === input) || 'random';

    //recieves the according info and posts, or derps
    await this.container.httpService
      .get(`${this._API_URL}/subs/?name=${subType}`)
      .then((response: IHttpResponse) => {
        const [subData] = response.data;
        const embed: MessageEmbed = this._generateEmbedSub(subData);

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

    await this._updateList();

    //setting up number of columns and rows for the list
    const maxCol = 3;
    const maxRows = 10;
    const numCols = Math.min(maxCol, Math.ceil(this._SUBS.length / maxRows));
    const numRows = Math.ceil(this._SUBS.length / numCols);

    //sets up a new embed for the list to reside in
    this._EMBED_LIST = new MessageEmbed();
    this._EMBED_LIST.setColor('#0099ff').setTitle('Types of Subs');
    const subs = this._SUBS.map((sub) => this._normalizeName(sub));

    //cycles through each column inserting their row, and also notes the alphabetic range
    for (let cols = 0; cols < numCols; cols++) {
      const columnSubs = subs.slice(numRows * cols, numRows * (cols + 1));

      //each column is a embed field note: only 3 fields can be lined up
      this._EMBED_LIST.addField(
        `${columnSubs[0].charAt(0)} - ${columnSubs[columnSubs.length - 1].charAt(0)}`,
        columnSubs.join('\n'),
        true
      );
    }
  }

  private _generateEmbedSub(subData: any): MessageEmbed {
    const embed: MessageEmbed = new MessageEmbed();
    const parsedNamed = this._normalizeName(subData.sub_name);

    //defaults to not on sale
    let saleInfo = `it isn't on sale currently, but who could say no to ${subData.price}.  The last time it was on sale was ${subData.last_sale}`;

    //status is true if the sub is on sale
    if (subData.status.toLowerCase() === 'true') {
      saleInfo = `for the discounted price of ${subData.price} until ${
        subData.last_sale.split('-')[1]
      }`;
    }

    embed.setColor('#0099ff').setTitle(parsedNamed + ' sub');

    embed.setDescription(
      `Get your own *${parsedNamed}* sub, ${saleInfo}.` +
        ` So what are you waiting for?  Come on down to Publix now to get yourself a beautiful sub.` +
        ` Just look at this beauty right here! 😍😍😍:pubsub::pubsub::pubsub:🤤🤤🤤`
    );

    embed.setImage(subData.image);

    embed.setFooter(`pulled from: pubsub-api.dev.`);

    return embed;
  }

  public validate(message: IMessage, args?: string[]) {
    const input = (args || []).join('-').toLowerCase();

    const keywordCheck: boolean = this._VALID_KEYS.includes(input);
    const subTypeCheck: boolean = this._SUBS.includes(input);

    return subTypeCheck || keywordCheck;
  }

  private _normalizeName(input: string): string {
    return input
      .replace(/-/g, ' ') // adds spaces
      .replace(/\b\w/g, (l: string) => l.toUpperCase()); // adds capitalization
  }
}
