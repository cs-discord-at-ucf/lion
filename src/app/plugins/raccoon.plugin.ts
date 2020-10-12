import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, IHttpResponse} from '../../common/types';
import { RichEmbed } from 'discord.js';



export class RaccoonPlugin extends Plugin {
  public name: string = 'Raccoon Plugin';
  public description: string = 'Generates pictures of raccoons.';
  public usage: string = 'raccoon';
  public pluginAlias = ['raccoon', 'racc'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://fetchit.dev/raccoon/';
  private _embedRacoon = new RichEmbed();

  constructor(public container: IContainer) {
    super();
  }
  public async execute(message: IMessage, args?: string[]) {
    await this.container.httpService
      .get(this._API_URL)
      .then((response: IHttpResponse) => {
            this._embedRacoon.setTitle("Raccoon spotted!");
            this._embedRacoon.setColor('#7289da');
            this._embedRacoon.setImage(response["data"]["raccoon"][0]["Image"])
            this._embedRacoon.setFooter("And just like that, he's gone");
            message.channel.send(this._embedRacoon)
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
