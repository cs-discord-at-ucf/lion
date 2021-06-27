// import { Mode } from '../../common/types';
import { Job } from '../../common/job';
import { IContainer } from '../../common/types';
import { TextChannel } from 'discord.js';

export class WeatherEventsJob extends Job {
  // Run once an hour
  public interval: number = 1000 * 60 * 60;

  // For debugging purposes only
  // public interval: number = 1000 * 10;
  public name: string = 'weather_events';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    const channel = (container.guildService.getChannel("weather_events")) as TextChannel;
    const resp = await container.httpService.get("https://api.weather.gov/alerts/active?area=FL");
    const data: IWeather_Event = resp.data;

    if (!data.features || data.features.length == 0) {
      return;
    }

    const relevantData: IFeaturesEntity[] = data.features.filter(rD => {
      const highSeverity = rD.properties.severity === 'Severe' 
                          || rD.properties.severity === 'Extreme';

      return highSeverity && rD.properties.senderName.includes("Orlando")
    });

    const relevantHeadlines: string[] = relevantData.map(rD => rD.properties.headline)

    // The warnings are automatically sorted from most to least recent, which
    // is why I reversed it.
    channel.send(relevantHeadlines.reverse().join("\n")).catch(err => console.log(err));
  }

}
export interface IWeather_Event {
  features?: (IFeaturesEntity)[] | null;
}

export interface IFeaturesEntity {
  properties: IProperties;
}
export interface IProperties {
  severity: string;
  headline: string;
  senderName: string;
}