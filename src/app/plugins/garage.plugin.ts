import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';

const cheerio = require('cheerio');

class Garage {
  public name: string = '';
  public available: number = 0;
  public saturation: number = 0;
  public capacity: number = 0;
  public percent_full: number = 0;
  public percent_avail: number = 0;
}

export class GaragePlugin extends Plugin {
  public name: string = 'Garage Plugin';
  public description: string = 'Get garage status';
  public usage: string = 'garage [which garage]';
  public permission: ChannelType = ChannelType.Public;

  private _API_URL: string = 'http://secure.parking.ucf.edu/GarageCount/iframe.aspx';
  private _TITLE_MSG: string = '**Current UCF Garage Saturation**';

  private process_response(text: String): Garage[] {
    const $ = cheerio.load(text);
    const garages = $('.dxgv');

    let last = '';
    let processed_garages: Garage[] = [];

    garages.map((idx: number, elem: Object) => {
      if (idx % 3 === 0)
        last = $(elem)
          .text()
          .replace('\n', '');
      else if (idx % 3 == 1) {
        const token = $(elem)
          .text()
          .trim()
          .split('/');
        let garage = {
          name: last,
          available: +token[0],
          saturation: 0,
          capacity: +token[1],
          percent_full: 0.0,
          percent_avail: 0.0,
		};

        garage.percent_avail = (100.0 * garage.available) / garage.capacity;
        garage.saturation = garage.capacity - garage.available;

		if (garage.saturation < 0)
			garage.saturation = 0;

        garage.percent_full = (100.0 * garage.saturation) / garage.capacity;

		processed_garages.push(garage);
      }
    });

    return processed_garages;
  }

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]): boolean {
    return true;
  }

  public hasPermission(message: IMessage): boolean {
    const channelName = this.container.messageService.getChannel(message).name;
    return this.container.channelService.hasPermission(channelName, this.permission);
  }

  public execute(message: IMessage, args?: string[]): void {
    this.container.httpService
      .get(`${this._API_URL}`)
      .then((response: IHttpResponse) => {
        const garages: Garage[] = this.process_response(response.data);
        let message_response: String = '';

        garages.map((elem: Garage) => {
          message_response += `${elem.name.replace('Garage ', '')}:`.padStart(6, ' ');
          message_response += `${elem.saturation} / ${elem.capacity}`.padStart(12, ' ');
          message_response += `(${`${Math.round(elem.percent_full)}`.padStart(
            2,
            ' '
          )}% full)`.padStart(12, ' ');
          message_response += '\n';
        });

        return message.reply(`${this._TITLE_MSG}\`\`\`${message_response}\`\`\``);
      })
      .catch((err) => console.log(err));
  }
}
