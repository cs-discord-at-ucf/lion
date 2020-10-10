import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';
import { RichEmbed } from 'discord.js';

export class PubSubPlugin extends Plugin {
  public name: string = 'Pub Sub Plugin';
  public description: string =
    'Get them prices for your subs, and a steamy picture of the subs you need in your life.';
  public usage: string = 'pubSub <sub (optional)>';
  public pluginAlias = ['sub', 'subs', 'sandwich', 'samwich', 'sarnie'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Food;

  private _API_URL: string = 'https://pubsub-api.dev/';
  private _subs: string[] = [];
  private _embedSubs = new RichEmbed();

  private _SUB_UPD_THRESH: number = 1000 * 60 * 60 * 24; // in ms, one day.
  private _LAST_UPD_TIME: number = -this._SUB_UPD_THRESH - 1;

  constructor(public container: IContainer) {
    super();
    this.updateList();
  }

  private updateList() {
    this.container.httpService
      .get(`${this._API_URL}allsubs/`)
      .then((response: IHttpResponse) => {
        const subs = response.data;

        this._subs = subs.map((subData: { name: string }) => subData.name.toLowerCase());
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    const subIn = this._parseCommand(args || []);

    if (subIn.includes('type') || subIn.includes('list')) {
      //Simply return the list of supported subs
      this._generateEmbedSubs();
      message.reply(this._embedSubs);
      return;
    }

    // checks if their sub was a sub, then if that sub is recognised
    const subType = this._subs.find((sub: string) => sub === subIn) || '';

    if (subType === '' && subIn !== 'random' && subIn !== '') {
      message.reply('Sub not found.  Use "list" or "type" to get a list of possible subs');
      return;
    }

    //recieves the according info and posts, or derps
    await this.container.httpService
      .get(`${this._API_URL}subs/?name=${subType}`)
      .then((response: IHttpResponse) => {
        const [subData] = response.data;
        const parsedNamed = subData.sub_name.replace(/-/g, ' ');

        const saleInfo =
          subData.status.toLowerCase() === 'true' //not sure why I have to do it this way but I do
            ? `a dicounted price of ${subData.price} until ${subData.last_sale.split('-')[1]}`
            : `${subData.price}, the last sale Date was ${subData.last_sale}`;

        const embed: RichEmbed = new RichEmbed();

        embed.setColor('#0099ff').setTitle(parsedNamed);

        embed.setDescription(
          `Get your own *${parsedNamed}* for ${saleInfo}. So what are you waiting for?  Come on down to Publix now to get yourself a beautiful sub. Just look at this beauty right here! 😍😍😍:pubsub::pubsub::pubsub:🤤🤤🤤`
        );

        embed.setImage(subData.image);

        message.reply(embed);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  private async _generateEmbedSubs(): Promise<void> {
    const lastListUpdate: number = Date.now() - this._LAST_UPD_TIME;
    if (lastListUpdate < this._SUB_UPD_THRESH) {
      return;
    } else {
      this._LAST_UPD_TIME = Date.now(); //since it only updates once a day, don't need to worry about accuracy
    }

    const numCols = Math.min(3, Math.ceil(this._subs.length / 10));
    const numRows = Math.ceil(this._subs.length / numCols);

    this._embedSubs = new RichEmbed();

    this._embedSubs.setColor('#0099ff').setTitle('Types of Subs');
    const subs = this._subs.map((sub) => sub.replace(/-/g, ' '));

    for (let cols = 0; cols < numCols; cols++) {
      const columnSubs = subs.slice(numRows * cols, numRows * (cols + 1));

      this._embedSubs.addField(
        `${columnSubs[0].charAt(0)} - ${columnSubs[columnSubs.length - 1].charAt(0)}`,
        columnSubs.join('\n'),
        true
      );
    }
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join('-');
  }
}
