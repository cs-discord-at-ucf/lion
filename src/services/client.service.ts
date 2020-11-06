import { Client } from 'discord.js';
import Environment from '../environment';

export class ClientService extends Client {
  private startTime: number;

  constructor() {
    super();
    this.login(Environment.DiscordToken);
    this.startTime = Date.now();
  }

  public getStartTime() {
    return this.startTime;
  }
}
