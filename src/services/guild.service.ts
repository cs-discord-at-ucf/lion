import { ClientService } from './client.service';
import { Guild, Role, User } from 'discord.js';

export class GuildService {
  private _guild: Guild;
  constructor(private _clientService: ClientService) {
    this._guild = this._clientService.guilds.first();
  }

  public get() {
    return this._guild;
  }

  //Returns whether a member has a role
  //Can be overloaded with the string name of the role or a Role object
  public userHasRole(user: User, roleName: string | Role): boolean {
    const member = this.get().members.get(user.id);
    if (!member) {
      return false;
    }

    if (typeof roleName === 'string') {
      const roleNameLower = roleName.toLowerCase();
      return member.roles.filter((r) => r.name.toLowerCase() === roleNameLower).size !== 0;
    } else {
      return member.roles.filter((r) => r === roleName).size !== 0;
    }
  }
}
