import { GuildMember } from 'discord.js';
import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class RejoinRoleHandler extends Handler {
  public name: string = 'RejoinRole';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(member: GuildMember): Promise<void> {
    const persistedRoles = this.container.userService.getPersistedRoles(member.id);
    if (!persistedRoles) {
      return;
    }

    await member.roles.add(persistedRoles);
  }
}
