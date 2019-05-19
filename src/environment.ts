import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const Environment = {
  DiscordToken: process.env.DISCORD_TOKEN,
};

export default Environment;
