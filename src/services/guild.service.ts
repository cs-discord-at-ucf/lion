import { ClientService } from './client.service';
import { Guild, Role, User } from 'discord.js';
import { Maybe } from '../common/types';
import Constants from '../common/constants';

export class GuildService {
  private _guild: Guild;
  private roleCache: Record<string, Maybe<Role>> = {
    [Constants.Roles.Unacknowledged]: undefined,
    [Constants.Roles.Unverifed]: undefined,
  };

  constructor(private _clientService: ClientService) {
    this._guild = this._clientService.guilds.first();

    Object.keys(this.roleCache).forEach((key) => {
      if (!this.roleCache[key]) {
        this.roleCache[key] = this.get()
          .roles.filter((r) => r.name === key)
          .first();
      }
    });
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

  public getRole(roleName: string): Role {
    return this.roleCache[roleName] as Role; //Shouldn't be undefined after constructor
  }
}
