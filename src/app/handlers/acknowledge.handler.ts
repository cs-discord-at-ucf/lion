import { MessageReaction, User } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';
import { MemberUtils } from '../util/member.util';

export class AcknowledgeHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(reaction: MessageReaction, user: User): Promise<void> {
    const member = this.container.guildService.get().members.get(user.id);
    if (!member) {
      return;
    }

    const cocChannel = this.container.guildService.getChannel(
      Constants.Channels.Public.CodeOfConduct
    );
    if (reaction.message.channel !== cocChannel) {
      return;
    }

    const unackRole = this.container.guildService.getRole(Constants.Roles.Unacknowledged);
    const hasRole = MemberUtils.hasRole(member, unackRole);
    if (hasRole) {
      await member.removeRole(unackRole);
    }
  }
}
