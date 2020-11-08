import { Client } from 'discord.js';
import Environment from '../environment';

export class ClientService extends Client {
  private startDate: Date;

  constructor() {
    super();
    this.login(Environment.DiscordToken);
    this.startDate = new Date();
  }

  public getStartDate() {
    return this.startDate;
  }
}
