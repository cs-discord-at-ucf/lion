import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const Environment = {
  DiscordToken: process.env.DISCORD_TOKEN,
  Playground: process.env.NODE_ENV,
  WeatherToken: process.env.WEATHER_TOKEN,
  StockApiToken: process.env.STOCK_API_TOKEN,
};

export default Environment;
