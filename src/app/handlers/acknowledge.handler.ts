import { MessageReaction, User } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';

export class AcknowledgeHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(reaction: MessageReaction, user: User): Promise<void> {
    //Get Member from user ID
    const member = this.container.guildService.get().members.get(user.id);
    if (!member) {
      return;
    }

    const CoC_Channel = member.guild.channels.find(
      (c) => c.name === Constants.Channels.Public.CodeOfConduct
    );

    if (reaction.message.channel != CoC_Channel) {
      return;
    }

    const role = member.guild.roles
      .filter((r) => r.name.toLowerCase() === 'unacknowledged')
      .first();
    const hasRole = Boolean(member.roles.array().some((r) => r === role));

    if (hasRole) {
      member.removeRole(role);
    }
  }
}
