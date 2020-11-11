import { GuildChannel, MessageReaction, User, Role } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';
import { Maybe } from '../../common/types';

export class AcknowledgeHandler implements IHandler {
  private _CoC_Channel: Maybe<GuildChannel> = undefined;
  private _roleCache: Record<string, Maybe<Role>> = {
    'Un Acknowledged': undefined,
  };
  private _UNACKNOWLEDGED_ROLE: string = 'Un Acknowledged';

  constructor(public container: IContainer) {}

  public async execute(reaction: MessageReaction, user: User): Promise<void> {
    if (!this._roleCache[this._UNACKNOWLEDGED_ROLE]) {
      this._roleCache[this._UNACKNOWLEDGED_ROLE] = this.container.guildService
        .get()
        .roles.filter((r) => r.name === this._UNACKNOWLEDGED_ROLE)
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

    const hasRole = member.roles
      .array()
      .some((r) => r === this._roleCache[this._UNACKNOWLEDGED_ROLE]);

    if (hasRole) {
      member.removeRole(<Role>this._roleCache[this._UNACKNOWLEDGED_ROLE]);
    }
  }
}
