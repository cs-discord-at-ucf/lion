import { GuildMember } from 'discord.js';
import { RoleType, RoleTypeKey } from './../common/types';

// roles are a hierarchical enum/type. the following is the hierarchy (use these keys defind in src/common/types in 'RoleType'):
//   Admin
//   Moderator
//   Teaching Assistant
//   RegularUser
//   Suspended
// an Admin can run everythin a Mod and below can run, a Mod can run everythin a TA and below can run ...
// exception:
// Suspended supersedes other roles, but has no effect on Moderators or Admins.
export class RoleService {
  hasPermission(member: GuildMember, minRoleToRun: RoleType): boolean {
    let memberRole: RoleType = RoleType.RegularUser;
    const orderedRoleTypes: RoleTypeKey[] = [
      'Admin',
      'Moderator',
      'Suspended',
      'Teaching Assistant',
    ];
    for (const roleType of orderedRoleTypes) {
      if (member.roles.cache.some(role => role.name === roleType)) {
        memberRole = RoleType[roleType];
        break;
      }
    }
    return memberRole >= minRoleToRun;
  }
}
