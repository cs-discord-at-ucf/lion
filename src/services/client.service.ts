import { Client } from 'discord.js';
import Environment from '../environment';

export class ClientService extends Client {
  constructor() {
    super();
    this.login(Environment.DiscordToken);
  }
}
