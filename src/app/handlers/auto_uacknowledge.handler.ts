import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class AutoAcknowledgeHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const unacknowledgedRole = member.guild.roles.filter(
      (role) => role.name.toLowerCase() === 'unacknowledged'
    );
    member.addRoles(unacknowledgedRole);
  }
}
