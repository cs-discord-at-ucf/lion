import { Client } from 'discord.js';

export class ClientService extends Client {
  private _startDate: Date;

  constructor() {
    super();
    this.login(process.env.DISCORD_TOKEN);
    this._startDate = new Date();
  }

  public getStartDate() {
    return this._startDate;
  }
}
