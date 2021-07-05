/* eslint-disable @typescript-eslint/naming-convention */

import { Snowflake } from 'discord.js';

// This is needed to tell TS that this is a module file.
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production';
      DISCORD_TOKEN?: string;
      WEATHER_TOKEN?: string;
      STOCK_API_TOKEN?: string;
      CRYPTO_API_TOKEN?: string;
      MONGO_URL?: string;
      MONGO_DB_NAME?: string;
      MONGO_USER_NAME?: string;
      MONGO_USER_PASS?: string;
      WARNINGS_RANGE?: string;
      WARNINGS_THRESH?: string;
      PAPERTRAIL_HOST?: string;
      PAPERTRAIL_PORT?: string;
      WEBSERVER_PORT?: string;
      TWITTER_BEARER_TOKEN?: string;
      WOLFRAM_APPID?: string;
      TESTER_TOKEN?: string;
      GUILD_ID?: Snowflake;
    }
  }
}
