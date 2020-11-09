import { MessageReaction, User } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class AcknowledgeHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(reaction: MessageReaction, user: User): Promise<void> {
    //Get Member from user ID
    const member = this.container.guildService.get().members.find((m) => m.id === user.id);
    const CoC_Channel = member.guild.channels.find((c) => c.name === 'code_of_conduct');

    if (reaction.message.channel != CoC_Channel) {
      return;
    }

    const role = member.guild.roles
      .filter((r) => r.name.toLowerCase() === 'unacknowledged')
      .first();
    const hasRole = Boolean(member.roles.filter((r) => r === role).array().length);

    if (!hasRole) {
      return;
    }
    member.removeRole(role);
  }
}
