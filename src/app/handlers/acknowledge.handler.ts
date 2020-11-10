import { GuildChannel, MessageReaction, User, Role } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';
import { Maybe } from '../../common/types';

export class AcknowledgeHandler implements IHandler {
  private _CoC_Channel: Maybe<GuildChannel> = undefined;
  private _targetRole: Maybe<Role> = undefined;

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

    if (!this._targetRole) {
      this._targetRole = member.guild.roles
        .filter((r) => r.name.toLowerCase() === 'unacknowledged')
        .first();
    }
    const hasRole = member.roles.array().some((r) => r === this._targetRole);

    if (hasRole) {
      member.removeRole(this._targetRole);
    }
  }
}
