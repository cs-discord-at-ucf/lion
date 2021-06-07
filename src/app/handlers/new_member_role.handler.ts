import { GuildMember, TextChannel } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import { MemberUtils } from '../util/member.util';
import Constants from '../../common/constants';

export class NewMemberRoleHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const unverifiedRole = this.container.guildService.getRole(Constants.Roles.Unverifed);
    const shouldUnverify = MemberUtils.shouldUnverify(member);
    if (!shouldUnverify) {
      return;
    }

    await member.roles.add(unverifiedRole);
    await this._pingUserInVerify(member);
    this.container.messageService.sendBotReport(
      `${member.user.toString()} has been automatically unverified.\n\t-Account is less than \`${MemberUtils.getAgeThreshold()}\` days old`
    );
  }

  private _pingUserInVerify(member: GuildMember) {
    const verifyChannel = this.container.guildService.getChannel(
      Constants.Channels.Bot.Verify
    ) as TextChannel;

    return verifyChannel.send(member.user.toString()).then((sentMsg) => {
      // Deletes instantly, but user still sees the notification until they view the channel
      sentMsg.delete();
    });
  }
}
