import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class RejoinRoleHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const persistedRoles = this.container.userService.getPersistedRoles(member.id);
    if (!persistedRoles) {
      return;
    }

    await member.roles.add(persistedRoles);
  }
}
