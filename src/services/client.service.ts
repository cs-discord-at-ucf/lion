import { Client } from 'discord.js';
import Environment from '../environment';

export class ClientService extends Client {
  private _startDate: Date;

  constructor() {
    super();
    void this.login(Environment.DiscordToken);
    this._startDate = new Date();
  }

  public getStartDate() {
    return this._startDate;
  }
}
