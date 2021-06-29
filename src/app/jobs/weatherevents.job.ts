import { Job } from '../../common/job';
import { IContainer } from '../../common/types';
import { TextChannel } from 'discord.js';

interface IWeather_Event {
  features?: (IFeaturesEntity)[] | null;
}

interface IFeaturesEntity {
  properties: IProperties;
}

interface IProperties {
  severity: string;
  headline: string;
  senderName: string;
}

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
    const data: IWeather_Event = resp.data;

    if (!data.features || data.features.length == 0) {
      return;
    }

    const headlines: string[] = data.features.filter(feature => {
      const highSeverity = feature.properties.severity === 'Severe' 
                          || feature.properties.severity === 'Extreme';

      return highSeverity && feature.properties.senderName.includes("Orlando")
    })
    .map(feature => feature.properties.headline);


    // The warnings are automatically sorted from most to least recent, which
    // is why I reversed it.
    await channel.send(headlines.reverse().join("\n")).catch(err => console.log(err));
  }
}
