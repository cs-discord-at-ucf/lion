import { ClientService } from './client.service';
import { Guild, Role, User, GuildChannel, ThreadChannel } from 'discord.js';
import { Maybe } from '../common/types';
import Constants from '../common/constants';

export class GuildService {
  private _guild: Guild;
  private _roleCache: Record<string, Maybe<Role>> = {
    [Constants.Roles.Unverifed]: undefined,
  };

  private _channelCache: Record<string, Maybe<GuildChannel | ThreadChannel>> = {
    [Constants.Channels.Info.CodeOfConduct]: undefined,
    [Constants.Channels.Bot.Verify]: undefined,
  };

  constructor(private _clientService: ClientService) {
    this._guild = this._clientService.guilds.cache.first() as Guild;
  }

  public get() {
    return this._guild;
  }

  // Returns whether a member has a role
  // Can be overloaded with the string name of the role or a Role object
  public userHasRole(user: User, roleName: string | Role): boolean {
    const member = this.get().members.cache.get(user.id);
    if (!member) {
      return false;
    }

    if (typeof roleName === 'string') {
      const roleNameLower = roleName.toLowerCase();
      return member.roles.cache.filter((r) => r.name.toLowerCase() === roleNameLower).size !== 0;
    } else {
      return member.roles.cache.filter((r) => r === roleName).size !== 0;
    }
  }

  public getRole(roleName: string): Role {
    if (!this._roleCache[roleName]) {
      this._roleCache[roleName] = this.get()
        .roles.cache.filter((r) => r.name === roleName)
        .first();
    }

    return this._roleCache[roleName] as Role;
  }

  public getChannel(chanName: string): GuildChannel | ThreadChannel {
    if (!this._channelCache[chanName]) {
      this._channelCache[chanName] = this.get()
        .channels.cache.filter((c) => c.name === chanName)
        .first();
    }

    return this._channelCache[chanName] as GuildChannel;
  }
}
