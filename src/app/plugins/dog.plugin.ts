import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';

export class DogPlugin extends Plugin {
  public name: string = 'Dog Plugin';
  public description: string = 'Generates pictures of doggos.';
  public usage: string = 'dog <breed>';
  public permission: ChannelType = ChannelType.Public;

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
      .catch((err) => console.log(err));
  }

  public validate(message: IMessage, args: string[]) {
    return this._breeds.includes(this._parseBreed(args));
  }

  public async execute(message: IMessage, args?: string[]) {
    const breed = this._parseBreed(args || []);
    await this.container.httpService
      .get(`${this._API_URL}breeds/${breed}/image`)
      .then((response: IHttpResponse) => {
        if (!!response.data.response.url) {
          message.reply('', {
            files: [response.data.response.url],
          });
        }
      })
      .catch((err) => console.log(err));
  }

  private _parseBreed(args: string[]): string {
    if (args.length === 0) return '';
    let breed = '';
    args.forEach((arg) => {
      breed += arg.toLowerCase() + ' ';
    });

    return breed.substr(0, breed.length - 1); // Removing trailing white-space.
  }
}
