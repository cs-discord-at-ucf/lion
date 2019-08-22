import { config } from 'dotenv';
import { resolve } from 'path';
import { POINT_CONVERSION_COMPRESSED } from 'constants';

config({ path: resolve(__dirname, '../.env') });

const Environment = {
  DiscordToken: process.env.DISCORD_TOKEN,
  Playground: process.env.NODE_ENV,
  WeatherToken: process.env.WEATHER_TOKEN
};

export default Environment;
