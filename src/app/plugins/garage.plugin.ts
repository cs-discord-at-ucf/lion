import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup, IHttpResponse, RoleType } from '../../common/types';
import { load } from 'cheerio';

interface IGarage {
  name: string;
  available: number;
  saturation: number;
  capacity: number;
  percentFull: number;
  percentAvail: number;
}

export default class GaragePlugin extends Plugin {
  public commandName: string = 'garage';
  public name: string = 'Garage Plugin';
  public description: string = 'Gets garage status.';
  public usage: string = 'garage <which garage>';
  public override pluginAlias = ['parking'];
  public permission: ChannelGroup = ChannelGroup.Bot;
  public override minRoleToRun = RoleType.Suspended;

  private _API_URL: string = 'http://secure.parking.ucf.edu/GarageCount/iframe.aspx';
  private _TITLE_MSG: string = '**Current UCF Garage Saturation**';

  private _GARAGE_UPD_THRESH: number = 1000 * 60 * 2; // in ms, two minutes.
  private _LAST_UPD_TIME: number = -this._GARAGE_UPD_THRESH - 1;
  private _GARAGES: IGarage[] = [];

  private _processResponse(text: string): IGarage[] {
    const $ = load(text);
    const garages = $('.dxgv');

    let last = '';
    const processed_garages: IGarage[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    garages.map((idx: number, elem: any) => {
      if (idx % 3 === 0) {
        last = $(elem).text().replace('\n', '');
      } else if (idx % 3 === 1) {
        const token = $(elem).text().trim().split('/');
        const garage: IGarage = {
          name: last,
          available: +token[0],
          saturation: 0,
          capacity: +token[1],
          percentFull: 0.0,
          percentAvail: 0.0,
        };

        garage.percentAvail = (100.0 * garage.available) / garage.capacity;
        garage.saturation = Math.max(0, garage.capacity - garage.available);

        garage.percentFull = (100.0 * garage.saturation) / garage.capacity;
        processed_garages.push(garage);
      }
    });

    return processed_garages;
  }

  private async _getGarages(): Promise<IGarage[]> {
    const time_since_last: number = Date.now() - this._LAST_UPD_TIME;
    if (time_since_last < this._GARAGE_UPD_THRESH) {
      return this._GARAGES;
    }

    this._LAST_UPD_TIME = Date.now();

    await this.container.httpService
      .get(`${this._API_URL}`)
      .then((response: IHttpResponse) => {
        return (this._GARAGES = this._processResponse(response.data));
      })
      .catch((err) => {
        this.container.loggerService.warn(err);
        return (this._GARAGES = []);
      });

    return this._GARAGES;
  }

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const garages: IGarage[] = await this._getGarages();

    const response = garages
      .map(
        (elem: IGarage) =>
          `${elem.name.replace('Garage ', '')}:`.padStart(6, ' ') +
          `${elem.saturation} / ${elem.capacity}`.padStart(12, ' ') +
          `(${`${Math.round(elem.percentFull)}`.padStart(2, ' ')}% full)`.padStart(12, ' ')
      )
      .join('\n');

    await message.reply(`\n${this._TITLE_MSG}\`\`\`${response}\`\`\``);
  }
}
