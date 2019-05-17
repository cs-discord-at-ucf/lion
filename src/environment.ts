import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env') });

const Environment = {
  DiscordToken: process.env.DISCORD_TOKEN,
};

export default Environment;
