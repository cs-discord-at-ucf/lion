import { GuildChannel, MessageReaction, User, Role } from 'discord.js';
import { IContainer, IHandler, Maybe } from '../../common/types';
import Constants from '../../common/constants';
import { MemberUtils } from '../util/member.util';

export class AcknowledgeHandler implements IHandler {
  private _CoC_Channel: Maybe<GuildChannel> = undefined;
  private _TARGET_ROLE_NAME: string = 'Un Acknowledged';
  private _UNACKNOWLEDGED_ROLE: Maybe<Role> = undefined;

  constructor(public container: IContainer) {}

  public async execute(reaction: MessageReaction, user: User): Promise<void> {
    if (!this._UNACKNOWLEDGED_ROLE) {
      this._UNACKNOWLEDGED_ROLE = this.container.guildService
        .get()
        .roles.filter((r) => r.name === this._TARGET_ROLE_NAME)
        .first();
    }

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

    const hasRole = MemberUtils.hasRole(member, this._UNACKNOWLEDGED_ROLE);
    if (hasRole) {
      await member.removeRole(this._UNACKNOWLEDGED_ROLE);
    }
  }
}
