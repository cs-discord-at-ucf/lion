import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';

export class ArianaPlugin extends Plugin {
  public name: string = 'Ariana Plugin';
  public description: string = 'Get a random picture of Ariana Grande.';
  public usage: string = 'ariana';
  public permission: ChannelType = ChannelType.Bot;

  private _API_URL: string = 'https://www.gettyimages.com/photos/ariana-grande?page='

  constructor(public container: IContainer) {
    super();

    this.container.httpService
      .get(`${this._API_URL}1`)
      .then((res: IHttpResponse) => {
        const data: string = res.data;
        let count: number|undefined = data.match(
          /<img class="gallery-asset__thumb gallery-mosaic-asset__thumb" src="/g
        )?.length;

        console.log(count)

        if (count) {
          count = Math.floor(Math.random() * count);
        }

        // const x = data.split(subString, index).join(subString).length
        console.log(count);
      })
  }

  public async execute(message: IMessage, args?: string[]) {

  }
}
