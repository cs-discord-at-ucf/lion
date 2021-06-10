import { GuildMember, Role } from 'discord.js';
import moment from 'moment';
import { Maybe } from '../common/types';
import { GuildService } from './guild.service';

export class UserService {
  private _STRIP_NON_NUMERIC: RegExp = /^\d/g;
  private _ageThreshold = moment.duration(2, 'days');

  constructor(private _guildService: GuildService) {}

  /**
   * Finds a user by tag, id, or username
   */
  public getMember(target: string): Maybe<GuildMember> {
    const strippedID = target.replace(this._STRIP_NON_NUMERIC, ''); // Remove extra stuff that can come when an @

    const user = this._guildService
      .get()
      .members.cache.filter((member) => {
        const { nickname } = member;
        const { tag, username, id } = member.user;
        return [nickname, tag, username, id].some((t) => t === target || t === strippedID);
      })
      .first();

    return user;
  }

  public shouldUnverify(member: GuildMember): boolean {
    const creationDate = member.user.createdTimestamp;
    const accountAge = creationDate;
    return accountAge <= this._ageThreshold.asMilliseconds();
  }

  public hasRole(member: GuildMember, roleName: string | Role): boolean {
    if (typeof roleName === 'string') {
      const roleNameLower = roleName.toLowerCase();
      return member.roles.cache.filter((r) => r.name.toLowerCase() === roleNameLower).size !== 0;
    }

    return member.roles.cache.filter((r) => r === roleName).size !== 0;
  }

  public getAgeThreshold() {
    return this._ageThreshold;
  }
}
