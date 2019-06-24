import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';

export class DogPlugin extends Plugin {
  public name: string = 'Dog Plugin';
  public description: string = 'This is an awesome dog plugin.';
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

  public validate(message: IMessage, args: string[]): boolean {
    return this._breeds.includes(this._parseBreed(args));
  }

  public hasPermission(message: IMessage): boolean {
    const channelName = this.container.messageService.getChannel(message).name;
    return this.container.channelService.hasPermission(channelName, this.permission);
  }

  public execute(message: IMessage, args?: string[]): void {
    const breed = this._parseBreed(args || []);
    this.container.httpService
      .get(`${this._API_URL}breeds/${breed}/image`)
      .then((response) => {
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
