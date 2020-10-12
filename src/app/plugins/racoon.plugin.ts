import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';
import { RichEmbed } from 'discord.js';

class Racoon {
  public Image: string = '';
}

export class RacoonPlugin extends Plugin {
  public name: string = 'Racoon Plugin';
  public description: string = 'Generates pictures of racoons.';
  public usage: string = 'racoon';
  public pluginAlias = ['racoon', 'racc'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://fetchit.tk/racoon/';
  private _breeds: Racoon[] = [];
  private _embedRacoon = new RichEmbed();

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (args === undefined || args.length === 0) {
      args = [''];
    }
    // Sends a get request to the api to grab a random image
    const response = await this.container.httpService.get(this._API_URL);
    const image = response["data"]["racoon"][0]["Image"]

    this._embedRacoon.setTitle("Racoon spotted!");
    this._embedRacoon.setColor('#7289da');
    this._embedRacoon.setImage(image)
    this._embedRacoon.setFooter("And just like that, he's gone");
    message.channel.send(this._embedRacoon)
    // embedBuffer.push(embed); 
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
