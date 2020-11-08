import { IContainer, IHandler, IMessage } from '../../common/types';

export class AutoUnverifyHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const hasAvatar = Boolean(message.author.avatar);
    if (hasAvatar) {
      return;
    }

    const unverifiedRole = message.guild.roles.filter((role) => role.name === 'Un verified');
    const member = await this.container.guildService.get().fetchMember(message.author.id);
    member.addRoles(unverifiedRole);
  }
}
