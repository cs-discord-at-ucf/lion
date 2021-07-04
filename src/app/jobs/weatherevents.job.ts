import { Job } from '../../common/job';
import { IContainer } from '../../common/types';
import { TextChannel } from 'discord.js';
import ms from 'ms';

interface IWeatherEvent {
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
  public name: string = 'Weather Events';
  public interval: number =  ms('1h');

  private static readonly _ENDPOINT: string = 'https://api.weather.gov/alerts/active?area=FL';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    const channel = (container.guildService.getChannel('weather_events')) as TextChannel;
    const resp = await container.httpService.get(WeatherEventsJob._ENDPOINT);
    const data: IWeatherEvent = resp.data;

    if (!data.features || data.features.length === 0) {
      return;
    }

    const headlines: string[] = data.features.filter(feature => {
      const highSeverity = feature.properties.severity === 'Severe' 
                          || feature.properties.severity === 'Extreme';

      return highSeverity && feature.properties.senderName.includes('Orlando');
    })
    .map(feature => feature.properties.headline);

    // Nothing new to send over
    if (headlines.length === 0) {
      return;
    }

    // The warnings are automatically sorted from most to least recent, which
    // is why I reversed it.
    await channel.send(headlines.reverse().join('\n')).catch(err => console.log(err));
  }
}
