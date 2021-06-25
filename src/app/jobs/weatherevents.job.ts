// import { Mode } from '../../common/types';
import { Job } from '../../common/job';
import { IContainer } from '../../common/types';
import { TextChannel } from 'discord.js';

export class WeatherEventsJob extends Job {
  // Run once an hour
  public interval: number = 1000 * 60 * 60;
  public name: string = 'weather_events';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    const channel = (container.guildService.getChannel("weather_events")) as TextChannel;
    const resp = await container.httpService.get("https://api.weather.gov/alerts/active?area=FL");
    const data: Weather_Event = resp.data;

    if (!data.features) {
      return;
    }

    const map: string[] = data.features.map(f => f.properties.headline);

    if (map.length == 0) {
      return;
    }

    channel.send(map.join(" ")).catch(err => console.log(err));
  }

}
export interface Weather_Event {
  type: string;
  features?: (FeaturesEntity)[] | null;
  title: string;
  updated: string;
}

export interface FeaturesEntity {
  id: string;
  type: string;
  geometry?: null;
  properties: Properties;
}
export interface Properties {
  id: string;
  areaDesc: string;
  geocode: Geocode;
  affectedZones?: (string)[] | null;
  references?: (null)[] | null;
  sent: string;
  effective: string;
  onset: string;
  expires: string;
  ends: string;
  status: string;
  messageType: string;
  category: string;
  severity: string;
  certainty: string;
  urgency: string;
  event: string;
  sender: string;
  senderName: string;
  headline: string;
  description: string;
  instruction: string;
  response: string;
  parameters: Parameters;
}
export interface Geocode {
  SAME?: (string)[] | null;
  UGC?: (string)[] | null;
}
export interface Parameters {
  PIL?: (string)[] | null;
  NWSheadline?: (string)[] | null;
  BLOCKCHANNEL?: (string)[] | null;
  VTEC?: (string)[] | null;
  eventEndingTime?: (string)[] | null;
}
