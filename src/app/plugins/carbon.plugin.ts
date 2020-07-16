import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Environment from '../../environment';
import { RichEmbed } from 'discord.js';

interface CarbonData {
  countryCode: string;
  data: {
    carbonIntensity: number;
    dateTime: string;
    fossilFuelPercentage: number;
  };
  status: string;
  units: {
    carbonIntensity: string;
  };
}

export class CarbonPlugin extends Plugin {
  public name: string = 'Carbon Plugin';
  public description: string = 'Gets Carbon Intensity @ UCF';
  public usage: string = 'carbon';
  public permission: ChannelType = ChannelType.Bot;

  private _API_URL: string = 'https://api.co2signal.com/v1/latest';
  private _BETWEEN_UPD_MS = 1000 * 60 * 2; // 2 minutes
  private _last_update: number = -this._BETWEEN_UPD_MS - 1;
  private _lastQuery: CarbonData = {
    countryCode: 'USA',
    data: {
      carbonIntensity: 0,
      dateTime: '',
      fossilFuelPercentage: 0,
    },
    status: '',
    units: {
      carbonIntensity: '',
    },
  };

  constructor(public container: IContainer) {
    super();
  }

  private async _getCarbonIntensity(region?: string) {
    const timeSinceLast: number = Date.now() - this._last_update;

    if (timeSinceLast < this._BETWEEN_UPD_MS && !region) {
      return this._lastQuery;
    }

    const ret = await this.container.httpService.getWithHeaders(
      this._API_URL,
      { countryCode: region || 'FR' },
      { 'auth-token': Environment.CarbonKey }
    );

    this._last_update = new Date().getTime();

    return (this._lastQuery = ret.data);
  }

  public async execute(message: IMessage, args?: string[]) {
    try {
      await this._getCarbonIntensity(args && args[0]);
    } catch (e) {
      console.error(e);
      message.reply('Something went wrong');
      return;
    }

    const embed = new RichEmbed();
    embed.setTitle(`CO2 Intensity @ ${this._lastQuery.countryCode}`);
    embed.setColor('#ff22ff');
    embed.setTimestamp(Date.now());

    embed.addField(
      'Carbon Intensity',
      `${Math.round(this._lastQuery.data.carbonIntensity)} ${this._lastQuery.units.carbonIntensity}`
    );

    embed.addField(
      'Fossil Fuel Percentage',
      `${Math.round(this._lastQuery.data.fossilFuelPercentage)}`
    );

    message.reply(embed);
  }
}
