// import { Mode } from '../../common/types';
import { Job } from '../../common/job';
import { IContainer } from '../../common/types';
import { TextChannel } from 'discord.js';

export class WeatherEventsJob extends Job {
  // Run once an hour
  public interval: number = 1000 * 60 * 60;
  // public interval: number = 1000 * 10;
  public name: string = 'weather_events';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    const channel = (container.guildService.getChannel("weather_events")) as TextChannel;
    const resp = await container.httpService.get("https://api.weather.gov/alerts/active?area=FL");
    const data: Weather_Event = resp.data;

    if (!data.features || data.features.length == 0) {
      return;
    }

    const relevantData: FeaturesEntity[] = data.features.filter(rD => {
      const highSeverity = rD.properties.severity === 'Severe' 
                          || rD.properties.severity === 'Extreme';

      return highSeverity && rD.properties.headline.includes("Orlando")
    });

    const relevantHeadlines: string[] = relevantData.map(rD => rD.properties.headline)

    channel.send(relevantHeadlines.join("\n")).catch(err => console.log(err));
  }

}
export interface Weather_Event {
  features?: (FeaturesEntity)[] | null;
}

export interface FeaturesEntity {
  properties: Properties;
}
export interface Properties {
  severity: string;
  headline: string;
}