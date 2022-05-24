import { RoleType, RoleTypeKey } from './../common/types';
import { GuildMember, Role, Collection } from 'discord.js';

// Expected:
// roles are a hierarchical enum/type. the following is the hierarchy (use these keys defind in src/common/types in 'RoleType'):
//   Admin
//   Moderator
//   Teaching Assistant
//   RegularUser
//   Suspended
// an Admin can run everythin a Mod and below can run, a Mod can run everythin a TA and below can run ...
// exception: 
// Suspended role supersedes any other role. 
// i.e., a member with both the with the Suspended and Admin roles can only run what a Suspended user can run
export class RoleService {
  // Expected:
  // returns a boolean marking if the member has permission to run the command
  hasPermission(member: GuildMember, minRoleToRun: number) {
    // REWRITE
  }
}
