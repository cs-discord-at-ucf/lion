import { GuildChannel, MessageReaction, User, Role } from 'discord.js';
import { IContainer, IHandler, Maybe } from '../../common/types';
import Constants from '../../common/constants';
import { MemberUtils } from '../util/member.util';

export class AcknowledgeHandler implements IHandler {
  private _CoC_Channel: Maybe<GuildChannel> = undefined;

  constructor(public container: IContainer) {}

  public async execute(reaction: MessageReaction, user: User): Promise<void> {
    const member = this.container.guildService.get().members.get(user.id);
    if (!member) {
      return;
    }

    if (!this._CoC_Channel) {
      this._CoC_Channel = member.guild.channels.find(
        (c) => c.name === Constants.Channels.Public.CodeOfConduct
      );
    }

    if (reaction.message.channel !== this._CoC_Channel) {
      return;
    }

    const unverifiedRole = this.container.guildService.getRole(Constants.Roles.Unverifed);
    const hasRole = MemberUtils.hasRole(member, unverifiedRole);
    if (hasRole) {
      await member.removeRole(unverifiedRole);
    }
  }
}
