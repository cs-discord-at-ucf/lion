import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class PersistRolesHandler implements IHandler {
  constructor(public container: IContainer) {}

  public execute(member: GuildMember) {
    const roles = Array.from(member.roles.cache.values());
    this.container.userService.setPersistedRoles(member.id, roles);
  }
}
