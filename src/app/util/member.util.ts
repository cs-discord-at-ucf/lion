import { GuildMember, Role } from 'discord.js';

export class MemberUtils {
  private static ageThreshold = 2;

  //Determines whether a member should be unverified
  //Does not specifically have to be age of account
  public static shouldUnverify(member: GuildMember): boolean {
    const creationDate = member.user.createdTimestamp;
    const accountAge = creationDate / 1000 / 60 / 60 / 24; //Convert ms to days
    return accountAge <= this.ageThreshold;
  }

  //Returns whether a member has a role
  //Can be overloaded with the string name of the role or a Role object
  public static hasRole(member: GuildMember, roleName: string | Role): boolean {
    if (typeof roleName === 'string') {
      const roleNameLower = roleName.toLowerCase();
      return member.roles.filter((r) => r.name.toLowerCase() === roleNameLower).size !== 0;
    } else {
      return member.roles.filter((r) => r === roleName).size !== 0;
    }
  }

  public static getAgeThreshold() {
    return this.ageThreshold;
  }
}
