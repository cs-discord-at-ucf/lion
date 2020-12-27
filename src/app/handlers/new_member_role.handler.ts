import { GuildMember, TextChannel, GuildChannel, Message } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import { MemberUtils } from '../util/member.util';
import Constants from '../../common/constants';

export class NewMemberRoleHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const unackRole = this.container.guildService.getRole(Constants.Roles.Unacknowledged);
    const unverifiedRole = this.container.guildService.getRole(Constants.Roles.Unverifed);
    member.addRole(unackRole);

    const shouldUnverify = MemberUtils.shouldUnverify(member);
    if (!shouldUnverify) {
      return;
    }

    await member.addRole(unverifiedRole).then(() => {
      this._pingUserInVerify(member);
      this.container.messageService.sendBotReport(
        `User \`${member.user.tag}\` has been automatically unverified`
      );
    });
  }

  private _pingUserInVerify(member: GuildMember) {
    const verifyChannel = this.container.guildService.getChannel(
      Constants.Channels.Bot.Verify
    ) as TextChannel;

    verifyChannel.send(member.user.toString()).then((sentMsg) => {
      (sentMsg as Message).delete(1000 * 60 * 60 * 12); //Delete after 12 hours
    });
  }
}
