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

  constructor(public container: IContainer) {
    super();
    this.updateList();
  }

  private updateList() {
    this.container.httpService
      .get(`${this._API_URL}allsubs/`)
      .then((response: IHttpResponse) => {
        const subs = response.data;

        this._subs = subs.map((subData: { name: string }) => {
          return subData.name
            .toLowerCase()
            .split('-')
            .join(' ');
        });
        this._generateEmbedSubs();
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    if (args === undefined || args.length === 0) {
      args = [''];
    }

    if (args[0].includes('type') || args[0].includes('list')) {
      //Simply return the list of supported subs
      message.reply(this._embedSubs);
      return;
    }

    const subIn = this._parseCommand(args);

    // checks if their sub was a sub, then if that sub is recognised
    const subEntry = this._subs.find((sub: string) => sub === subIn) || '';

    if (subIn == 'reboot') {
      this.updateList();
      return;
    } else if (subEntry == '' && subIn != 'random' && subIn != '') {
      message.reply('Sub not found.  Use "list" or "type" to get a list of possible subs');
      return;
    }

    this.container.loggerService.debug(subEntry);

    //recieves the according info and posts, or derps
    await this.container.httpService
      .get(`${this._API_URL}subs/?name=${subEntry.split(' ').join('-')}`)
      .then((response: IHttpResponse) => {
        const subData = response.data[0];
        const saleInfo = subData.status
          ? `a dicounted price of ${subData.price} until ${subData.last_sale.split('-')[1]}`
          : `${subData.price}, the last sale Date was ${subData.last_sale}`;

        const embed: RichEmbed = new RichEmbed();

        embed.setColor('#0099ff').setTitle(subData.sub_name.split('-').join(' '));

        embed.description = `Get your own *${subData.sub_name
          .split('-')
          .join(
            ' '
          )}* for ${saleInfo}. So what are you waiting for?  Come on down to Publix now to get yourself a beautiful sub. Just look at this beauty right here! 😍😍😍🤤🤤🤤`;

        embed.setImage(subData.image);

        message.reply(embed);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  private _generateEmbedSubs() {
    const numCols = Math.min(3, Math.ceil(this._subs.length / 10));
    const numRows = Math.ceil(this._subs.length / numCols);

    this._embedSubs = new RichEmbed();

    this._embedSubs.setColor('#0099ff').setTitle('Types of Subs');

    for (let Cols = 0; Cols < numCols; Cols++) {
      const columnSubs = this._subs.slice(numRows * Cols, numRows * (Cols + 1));

      this._embedSubs.addField(
        `${columnSubs[0].charAt(0)} - ${columnSubs[columnSubs.length - 1].charAt(0)}`,
        columnSubs.join('\n'),
        true
      );
    }
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
