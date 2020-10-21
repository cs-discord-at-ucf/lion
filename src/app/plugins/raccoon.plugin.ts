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
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    try {
    await this.container.httpService
      .get(this._API_URL)
      .then((response: IHttpResponse) => {
            const embedRacoon: RichEmbed = new RichEmbed();
            embedRacoon.setTitle("Raccoon spotted!");
            embedRacoon.setColor('#7289da');
            embedRacoon.setImage(response["data"]["raccoon"][0]["Image"]);
            embedRacoon.setFooter("And just like that, he's gone");
            message.reply(embedRacoon);
        })
      .catch((err) => this.container.loggerService.warn(err));
    }
  catch(err) {
    this.container.loggerService.warn(err);
    }
  }
}
