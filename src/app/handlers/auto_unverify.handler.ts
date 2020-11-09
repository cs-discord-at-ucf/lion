import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class AutoUnverifyHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const hasAvatar = Boolean(member.user.avatar);
    if (hasAvatar) {
      return;
    }

    const unverifiedRole = member.guild.roles.filter((role) => role.name === 'Un verified');
    member.addRoles(unverifiedRole);
  }
}
