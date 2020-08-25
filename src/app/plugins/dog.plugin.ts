import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';

export class DogPlugin extends Plugin {
  public name: string = 'Dog Plugin';
  public description: string = 'Generates pictures of doggos.';
  public usage: string = 'dog <breed>';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://api.woofbot.io/v1/';
  private _breeds: string[] = [];

  constructor(public container: IContainer) {
    super();
    this.container.httpService
      .get(`${this._API_URL}breeds`)
      .then((response: IHttpResponse) => {
        const breeds: string[] = response.data.response.breeds;
        breeds.forEach((breed) => {
          this._breeds.push(breed.toLowerCase());
        });
      })
      .catch(this.container.loggerService.warning);
  }

  public async execute(message: IMessage, args?: string[]) {
    let breed = this._parseBreed(args || []);

    if (breed === '' || breed.toLowerCase() === "random") {
      breed = this._breeds[this._getRandomInt(this._breeds.length)];
    }

    if (!this._breeds.includes(breed)) {
      message.reply(`Breeds supported: \n\`\`\`\n${this._breeds.join('\n')}\`\`\``);
      return;
    }

    await this.container.httpService
      .get(`${this._API_URL}breeds/${breed}/image`)
      .then((response: IHttpResponse) => {
        if (!!response.data.response.url) {
          message.reply('', {
            files: [response.data.response.url],
          });
        }
      })
      .catch(this.container.loggerService.warning);
  }

  private _getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }

  private _parseBreed(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
