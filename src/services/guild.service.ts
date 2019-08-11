import { ClientService } from './client.service';
import { Guild } from 'discord.js';

export class GuildService {
  private _guild: Guild;
  constructor(private _clientService: ClientService) {
    this._guild = this._clientService.guilds.first();
  }

  public get() {
    return this._guild;
  }
}
