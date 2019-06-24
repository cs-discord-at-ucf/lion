import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';

const cheerio = require("cheerio")

class Garage {
	public name : string = "";
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

	private _API_URL: string = "http://secure.parking.ucf.edu/GarageCount/iframe.aspx";
	private title_message: string = "**Current UCF Garage Saturation**"

	public process_response(text: String): Garage[] {
		const $ = cheerio.load(text)
		const garages = $(".dxgv")

		var last = ""
		var ret: Garage[] = []

		garages.map((idx: number, elem: Object) => {
			if (idx % 3 == 0)
				last = $(elem).text().replace("\n","")
			else if (idx % 3 == 1) {
				const tok = $(elem).text().trim().split("/")
				var gar = {
					name: last,
					available: +tok[0],
					saturation: 0,
					capacity: +tok[1],
					percent_full: 0.0,
					percent_avail: 0.0
				}
				gar.percent_avail = 100.0 * gar.available / gar.capacity
				gar.saturation = gar.capacity - gar.available
				if (gar.saturation < 0) gar.saturation = 0
				gar.percent_full = 100.00 * gar.saturation / gar.capacity
				ret.push(gar)
			}
		})

		return ret
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
			.then((response) => {
				const garages: Garage[] = this.process_response(response.data)
				var str = ""

				garages.map((elem : Garage) => {
					str += `${elem.name.replace("Garage ", "")}:`.padStart(6, ' ')
					str += `${elem.saturation} / ${elem.capacity}`.padStart(12, ' ')
					str += `(${`${Math.round(elem.percent_full)}`.padStart(2, ' ')}% full)`.padStart(12, ' ')
					str += '\n'
				})

				return message.reply(`${this.title_message}\`\`\`${str}\`\`\``);
			})
			.catch((err) => console.log(err));
	}
}
