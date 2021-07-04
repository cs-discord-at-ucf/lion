import { GuildMember, Role, Snowflake } from 'discord.js';
import ms from 'ms';
import { Maybe } from '../common/types';
import { GuildService } from './guild.service';

export class UserService {
  public static readonly AGE_THRESHOLD = ms('2d');

  private _STRIP_NON_NUMERIC: RegExp = /^\d/g;
  private _persistedRoles: Record<string, Role[]> = {};

  constructor(private _guildService: GuildService) {}

  /**
   * Finds a user by tag, id, or username
   */
  public getMember(target: string): Maybe<GuildMember> {
    const strippedID = target.replace(this._STRIP_NON_NUMERIC, ''); // Remove extra stuff that can come when an @

    return this._guildService
      .get()
      .members.cache.filter((member) => {
        const { nickname } = member;
        const { tag, username, id } = member.user;
        return [nickname, tag, username, id].some((t) => t === target || t === strippedID);
      })
      .first();
  }

  public shouldUnverify(member: GuildMember): boolean {
    const creationDate = member.user.createdTimestamp;
    const accountAge = creationDate;
    return accountAge <= UserService.AGE_THRESHOLD;
  }

  public hasRole(member: GuildMember, roleName: string | Role): boolean {
    if (typeof roleName === 'string') {
      const roleNameLower = roleName.toLowerCase();
      return member.roles.cache.filter((r) => r.name.toLowerCase() === roleNameLower).size !== 0;
    }

    return member.roles.cache.filter((r) => r === roleName).size !== 0;
  }

  public getPersistedRoles(id: Snowflake): Maybe<Role[]> {
    return this._persistedRoles[id];
  }

  public setPersistedRoles(id: Snowflake, roles: Role[]) {
    this._persistedRoles[id] = roles;
  }
}
