import { RoleType, RoleTypeKey } from './../common/types';
import { GuildMember, Role, Collection } from 'discord.js';

export class RoleService {
  hasPermission(member: GuildMember, minRoleToRun: number) {
    const roles = member.roles;
    const highestRole = this._getHighestRole(roles);
    return highestRole >= minRoleToRun;
  }

  private _getHighestRole(roles: Collection<string, Role>) {
    let highestRole = 0;

    roles.forEach((role: Role) => {
      if (role.name in RoleType) {
        if (role.name === 'Suspended') return -10;
        highestRole = Math.max(highestRole, RoleType[<RoleTypeKey>role.name]);
      }
    });

    return highestRole;
  }
}
