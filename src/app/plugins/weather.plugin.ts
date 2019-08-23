import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { RichEmbed } from 'discord.js';
import Environment from '../../environment';

export class WeatherPlugin extends Plugin {
  public name: string = 'Weather Plugin';
  public description: string = 'Retrieves weather forecast.';
  public usage: string = '';
  public permission: ChannelType = ChannelType.Bot;
  private default_location: string = 'Orlando';
  private forecast_num: number = 3;
  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]): boolean {
    return true;
  }

  private getWeather(type: string, message: IMessage): string {
    const inputRegex: RegExp = /^!weather ([a-zA-Z ]+|\d{5})$/;
    let key: string = '';
    const out: RegExpExecArray | null = inputRegex.exec(message.toString());
    let city: string = '';

    if (out == null) {
      city = this.default_location;
      key = 'q';
    } else {
      city = out[1];
      if (Number(out[1])) {
        key = 'zip';
      } else {
        key = 'q';
      }
    }

    return `https://api.openweathermap.org/data/2.5/${type}?${key}=${city}&units=imperial&apikey=${
      Environment.WeatherToken
    }`;
  }

  private createEmbed(wrawdata: JSON, frawdata: JSON): RichEmbed {
    const embed: RichEmbed = new RichEmbed();

    const wdata = JSON.parse(JSON.stringify(wrawdata));
    const fdata = JSON.parse(JSON.stringify(frawdata));
    const country: string = wdata.sys.country.toLowerCase();
    const weather_code: number = wdata.weather[0].id;
    const title_desc: string = `${this.getTempComment(
      weather_code,
      wdata.main.temp
    )}\n${this.getWindComment(wdata.wind.speed)}`;
    const desc: string = this.capitalize(wdata.weather[0].description);

    let s: string = '';
    const date: Date = new Date();
    const diff: number = Math.ceil((date.getTime() / 1000 - Number(wdata.dt)) / 60);
    if (diff > 1) s = 's';
    embed.setFooter(`Last Updated ${diff} minute${s} ago`);
    embed.setTimestamp(wdata['dt'] * 1000);
    embed.addField(`${wdata.name} :flag_${country}:`, `${title_desc}`);
    embed.setColor('#ffee05');
    embed.setThumbnail(
      `https://www.gstatic.cn/onebox/weather/128/${this.getWeatherIcon(weather_code)}.png`
    );
    embed.addField(
      'Temperature',
      `🌡 ${Math.floor(wdata.main.temp)}°F (${Math.floor(((wdata.main.temp - 32) * 5) / 9)}°C)`,
      true
    );
    embed.addField('Description', `📢 ${desc}`, true);

    let rain: number = 0;
    let rain_resp: string = 'last hour';
    if (wdata.rain != null) {
      if (wdata.rain['1h'] != null) {
        rain = wdata['rain']['1h'];
      } else {
        rain = wdata['rain']['3h'];
        rain_resp = 'last 3 hours';
      }
    } else {
      rain = 0;
    }
    embed.addField('Rainfall', `${rain}mm in ${rain_resp}`, true);

    let wind_dir: string = '';
    if (wdata.wind != null) {
      if (wdata.wind.deg != null) wind_dir = this.getWindArrow(wdata.wind['deg']);
    } else wind_dir = this.getWindArrow(-1);
    embed.addField('Wind', `💨 ${Math.floor(wdata.wind.speed)} ${wind_dir}`, true);

    embed.addField('​', '​', false);
    embed.addField('Forecast', this.generateForecast(fdata));
    return embed;
  }

  private generateForecast(fdata: any): string {
    let output: string = '';
    let x: number = 0;
    let xc: number = 0;

    while (xc < this.forecast_num) {
      const tdata = fdata['list'][x];
      const timestamp = tdata['dt'];
      const hours: number = Math.ceil((timestamp - Math.round(Date.now() / 1000)) / 3600);

      if (hours > 0) {
        const dt = new Date(timestamp * 1000);
        let strf: string = dt.getHours().toString();
        strf += Math.floor(dt.getHours() / 12) < 1 ? 'AM' : 'PM';

        const weather_id = tdata.weather[0].id;

        output += `**${hours} hours (${strf})** - `;
        output += `${Math.round(tdata.main.temp)} °F`;
        output += `   -   ${this.getWeatherEmoji(weather_id)} ${this.capitalize(
          tdata.weather[0].description
        )}\n`;
        xc += 1;
      }
      x += 1;
    }

    return output;
  }
  private getWeatherEmoji(code: number): string {
    if (code >= 800) {
      if (code == 800) return '☀️';
      else if (code == 801) return '🌤️';
      else if (code == 802) return '⛅';
      else if (code == 803) return '🌥️';
      else return '☁️';
    }

    if (code >= 700) {
      if (code == 781) return '🌪️';
      else return '🌫️';
    }

    if (code >= 600) {
      return '🌨️';
    }

    if (code >= 500) {
      if (code < 520) return '🌧️';
      else return '🌦️';
    }
    if (code >= 300) {
      return '🌦️';
    }
    if (code >= 200) {
      if (code < 210 || code >= 230) return '⛈️';
      else return '🌩️';
    }

    return '';
  }
  private getTempComment(wid: number, temp: number): string {
    if (temp >= 80 && (wid == 800 || wid == 801)) return 'Suns out guns out 💪😎';
    else if (temp >= 100) return "It's a right scorcher 🔥";
    else if (temp >= 90) return "It's pretty hot out 🌞";
    else if (temp >= 80) return "It's a little hot 🌞";
    else if (temp >= 70) return "It's comfortably warm 👌";
    else if (temp >= 60) return 'It might be a bit chilly';
    else if (temp >= 42) return "It's cold - don't forget your jacket";
    else if (temp >= 32) return 'Almost freezing - wrap up warm';
    else return "It's below freezing! ❄️";
  }
  private getWindComment(wspeed: number): string {
    if (wspeed > 50) return '⚠️ Dangerously high wind level';
    else if (wspeed > 40) return 'It is extremely windy';
    else if (wspeed > 30) return 'It is very windy';
    else if (wspeed > 24) return 'It is fairly windy';
    else if (wspeed > 18) return 'It is a little windy';
    else if (wspeed > 12) return 'There is a moderate breeze';
    else if (wspeed > 7) return 'There is a gentle breeze';
    else if (wspeed > 3) return 'There is a light breeze';
    else return '';
  }
  private getWindArrow(wdir: number) {
    if (wdir == -1) return '';

    if (wdir > 337.5 || wdir <= 22.5) return ':arrow_down:';
    else if (wdir <= 67.5) return ':arrow_lower_left:';
    else if (wdir <= 112.5) return ':arrow_left:';
    else if (wdir <= 157.5) return ':arrow_upper_left:';
    else if (wdir <= 202.5) return ':arrow_up:';
    else if (wdir <= 247.5) return ':arrow_upper_right:';
    else if (wdir <= 292.5) return ':arrow_right:';
    else return ':arrow_lower_right:';
  }
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  private getWeatherIcon(code: number): string {
    if (code >= 800) {
      if (code == 800) return 'sunny';
      else if (code == 801) return 'sunny_s_cloudy';
      else if (code == 802) return 'partly_cloudy';
      else return 'cloudy';
    }

    if (code >= 700) {
      if (code == 701) return 'mist';
      else return 'fog';
    }

    if (code >= 600) {
      if (code == 600) return 'snow_light';
      else if (code < 611) return 'snow';
      else if (code == 611) return 'sleet';
      else return 'snow_s_rain';
    }

    if (code >= 500) {
      if (code == 500) return 'rain_light';
      else if (code == 501) return 'rain';
      else if (code < 511) return 'rain_heavy';
      else return 'sunny_s_rain';
    }
    if (code >= 300) {
      return 'sunny_s_rain';
    }
    if (code >= 200) {
      return 'thunderstorms';
    }

    return '';
  }
  public async execute(message: IMessage, args?: string[]) {
    if (Environment.WeatherToken == null) {
      message.channel.send('Weather code is setup incorrectly');
      console.log('Weather code is setup incorrectly');
      return;
    }

    const weatherUrl: string = this.getWeather('weather', message);
    const forecastUrl: string = this.getWeather('forecast', message);

    this.container.httpService.get(weatherUrl).then((wdata) => {
      this.container.httpService.get(forecastUrl).then((fdata) => {
        const embed = this.createEmbed(wdata.data, fdata.data);
        message.channel.send(embed);
      });
    });
  }
}
