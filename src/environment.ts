import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const Environment = {
  DiscordToken: process.env.DISCORD_TOKEN,
  Playground: process.env.NODE_ENV,
  WeatherToken: process.env.WEATHER_TOKEN,
  StockApiToken: process.env.STOCK_API_TOKEN,
  CryptoApiToken: process.env.CRYPTO_API_TOKEN,
  MongoURL: process.env.MONGO_URL,
  MongoDatabase: process.env.MONGO_DB_NAME,
  MongoUsername: process.env.MONGO_USER_NAME,
  MongoPassword: process.env.MONGO_USER_PASS,
  WarningsRange: +(process.env.WARNINGS_RANGE || 14),
  WarningsThresh: +(process.env.WARNINGS_THRESH || 3),
  PapertrailHost: process.env.PAPERTRAIL_HOST,
  PapertrailPort: process.env.PAPERTRAIL_PORT,
  WebserverPort: process.env.WEBSERVER_PORT || 3000,
  TwitterBearerToken: process.env.TWITTER_BEARER_TOKEN,
  GuildID: process.env.GUILD_ID as `${bigint}` | undefined,
  WolframAppID: process.env.WOLFRAM_APPID,
};

export default Environment;
