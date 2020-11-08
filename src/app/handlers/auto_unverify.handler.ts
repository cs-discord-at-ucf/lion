import { IContainer, IHandler, IMessage } from '../../common/types';

export class AutoUnverifyHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const avatar = message.author.avatar; //This is null if they have default avatar

    if (!avatar) {
      const unverifiedRole = message.guild.roles.filter((role) => role.name === 'Un verified');
      const targetGuildMember = message.guild.members
        .filter((user) => user.id === message.author.id)
        .first();

      targetGuildMember.addRoles(unverifiedRole);
    }
  }
}
