import { Client, Intents } from 'discord.js';
import Environment from '../environment';

export class ClientService extends Client {
  private _startDate: Date;

  constructor() {
    // Discord.js v13 change - https://deploy-preview-551--discordjs-guide.netlify.app/additional-info/changes-in-v13.html#intents
    super({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
    this.login(Environment.DiscordToken);
    this._startDate = new Date();
  }

  public getStartDate() {
    return this._startDate;
  }
}
