import { Client, Intents } from 'discord.js';

export class ClientService extends Client {
  private _startDate: Date;

  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
    });
    this.login(process.env.DISCORD_TOKEN);
    this._startDate = new Date();
  }

  public getStartDate() {
    return this._startDate;
  }
}
