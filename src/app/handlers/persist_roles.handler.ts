import { GuildMember } from 'discord.js';
import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class PersistRolesHandler extends Handler {
  public name: string = 'PersistRole';

  constructor(public container: IContainer) {
    super();
  }

  public execute(member: GuildMember) {
    const roles = Array.from(member.roles.cache.values());
    this.container.userService.setPersistedRoles(member.id, roles);
  }
}
