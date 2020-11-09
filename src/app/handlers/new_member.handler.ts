import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class NewMemberHandler implements IHandler {
  private _unverifiedRole: any = undefined;
  private _unacknowledgedRole: any = undefined;

  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    if (!this._unacknowledgedRole) {
      this._unacknowledgedRole = member.guild.roles
        .filter((role) => role.name === 'Unacknowledged')
        .first();
    }
    member.addRole(this._unacknowledgedRole);

    const hasAvatar = Boolean(member.user.avatar);
    if (hasAvatar) {
      return;
    }

    if (!this._unverifiedRole) {
      this._unverifiedRole = member.guild.roles
        .filter((role) => role.name === 'Un verified')
        .first();
    }
    member.addRole(this._unverifiedRole);
    this.container.messageService.sendBotReport(
      `User \`${member.user.tag}\` has been automatically unverified`
    );
  }
}
