import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';

export class ArianaPlugin extends Plugin {
  public name: string = 'Ariana Plugin';
  public description: string = 'Get a random picture of Ariana Grande.';
  public usage: string = 'ariana';
  public permission: ChannelType = ChannelType.Bot;

  private _API_URL: string = 'https://www.gettyimages.com/photos/ariana-grande?page=';
  private reImgs: RegExp = new RegExp(/<img class="gallery-asset__thumb gallery-mosaic-asset__thumb"(.*?)>/g);
  private reThumb: RegExp = new RegExp(/https:\/\/(.*?)"/g);
  private rePages: RegExp = new RegExp(/https:\/\/(.*?)=/g);
  private nPages: number = 1;

  constructor(public container: IContainer) {
    super();

    this.container.httpService
      .get(this._API_URL + this.nPages)
      .then((res: IHttpResponse) => {
        const data: string = res.data;
        const imgSearch = data.match(this.reImgs);

        if (!imgSearch) {
          console.log('No Ariana :(');
          return; // no picture links found
        }

        const count: number = Math.floor(Math.random() * imgSearch.length);

        const url = imgSearch[count].match(this.reThumb);
        if (url) {
          console.log(url)
          console.log(url[0].replace(/amp;|"/g, ''));
        }

        console.log(imgSearch.length);
      })
  }

  private async getAri() {
    const ari = await this.container.httpService
      .get(this._API_URL + this.nPages)
      .then((res: IHttpResponse) => {
        const data: string = res.data;
        const imgSearch = data.match(this.reImgs);

        if (!imgSearch) {
          console.log('No Ariana :(');
          return; // no picture link found
        }

        const count: number = Math.floor(Math.random() * imgSearch.length);

        const url = imgSearch[count].match(this.reThumb);
        if (url) {
          console.log(url)
          console.log(url[0].replace(/amp;|"/g, ''));
        } else {
          console.log('No Ariana :(');
          return; // no picture link found
        }
      })
      .catch((err) => this.container.loggerService.warn(err));

    return ari;
  }

  public async execute(message: IMessage, args?: string[]) {

  }
}
