import { GuildMember, Role } from 'discord.js';
import { IContainer, IHandler, Maybe } from '../../common/types';

export class NewMemberHandler implements IHandler {
  private _UNACKNOWLEDGED_ROLE: string = 'Un Acknowledged';
  private _UNVERIFIED_ROLE: string = 'Un verified';
  private _roleCache: Record<string, Maybe<Role>> = {
    [this._UNACKNOWLEDGED_ROLE]: undefined,
    [this._UNVERIFIED_ROLE]: undefined,
  };

  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    if (!this._roleCache[this._UNACKNOWLEDGED_ROLE]) {
      Object.keys(this._roleCache).forEach((key) => {
        this._roleCache[key] = member.guild.roles.filter((r) => r.name === key).first();
      });
    }

    //Required to remove optional | undefined
    if (!this._roleCache[this._UNACKNOWLEDGED_ROLE]) {
      return;
    }
    member.addRole(<Role>this._roleCache[this._UNACKNOWLEDGED_ROLE]);

    const hasAvatar = Boolean(member.user.avatar);
    if (hasAvatar) {
      return;
    }

    if (!this._roleCache[this._UNVERIFIED_ROLE]) {
      return;
    }
    member.addRole(<Role>this._roleCache[this._UNVERIFIED_ROLE]);
    this.container.messageService.sendBotReport(
      `User \`${member.user.tag}\` has been automatically unverified`
    );
  }
}
