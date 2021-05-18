import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';

export class ArianaPlugin extends Plugin {
  public name: string = 'Ariana Plugin';
  public description: string = 'Get a random picture of Ariana Grande.';
  public usage: string = 'ariana';
  public pluginAlias = ['ari'];
  public permission: ChannelType = ChannelType.Bot;

  private _API_URL: string = 'https://www.gettyimages.com/photos/ariana-grande?page=';
  private reImgs: RegExp = new RegExp(/<img class="gallery-asset__thumb gallery-mosaic-asset__thumb"(.*?)>/g);
  private reThumb: RegExp = new RegExp(/https:\/\/(.*?)"/g);
  private rePages: RegExp = new RegExp(/<span class="PaginationRow-module__lastPage___2pChH">(.*?)<\/span>/g);
  private rePage: RegExp = new RegExp(/>(.*?)</g);
  private nPages: number = 0;

  constructor(public container: IContainer) {
    super();

    // get total number of pages of Ariana
    this.container.httpService
      .get(this._API_URL + '1')
      .then((res: IHttpResponse) => {
        const data: string = res.data;
        const pagesSearch: RegExpMatchArray | null = data.match(this.rePages);

        if (!pagesSearch) {
          this.container.loggerService.warn('Failed to get Ariana page in constructor.');
          return;
        }
        const pageSearch: RegExpMatchArray | null = pagesSearch[0].match(this.rePage);
        if (pageSearch) {
          this.nPages = parseInt(pageSearch[0].replace(/>|</g, ''));
        }
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  private async getAri(page: number) {
    let ari;
    await this.container.httpService
      .get(this._API_URL + page)
      .then((res: IHttpResponse) => {
        const data: string = res.data;
        const imgSearch: RegExpMatchArray | null = data.match(this.reImgs);

        if (!imgSearch) {
          return;
        }

        const count: number = Math.floor(Math.random() * imgSearch.length);

        const url = imgSearch[count].match(this.reThumb);
        if (url) {
          ari = url[0].replace(/amp;|"/g, '');
        } else {
          return;
        }
      })
      .catch((err) => this.container.loggerService.warn(err));

    return ari;
  }

  public async execute(message: IMessage, args?: string[]) {
    const page = Math.floor(Math.random() * this.nPages) + 1;
    const ari = await this.getAri(page);
    if (ari) {
      await message.reply('', {
        files: [{
          attachment: ari,
          name: 'ari.jpg'
        }]});
      } else {
      await message.reply('No Ariana <:sadkek:811400946097717328>');
    }
  }
}
