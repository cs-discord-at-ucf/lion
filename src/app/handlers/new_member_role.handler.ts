import { GuildMember, Role, TextChannel, GuildChannel, Message } from 'discord.js';
import { IContainer, IHandler, Maybe } from '../../common/types';
import { MemberUtils } from '../util/member.util';
import Constants from '../../common/constants';

export class NewMemberRoleHandler implements IHandler {
  private _UNACKNOWLEDGED_ROLE: string = 'Un Acknowledged';
  private _UNVERIFIED_ROLE: string = 'Un verified';
  private _roleCache: Record<string, Maybe<Role>> = {
    [this._UNACKNOWLEDGED_ROLE]: undefined,
    [this._UNVERIFIED_ROLE]: undefined,
  };
  private _VERIFY_CHANNEL: Maybe<TextChannel> = undefined;

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

    const shouldUnverify = MemberUtils.shouldUnverify(member);
    if (!shouldUnverify) {
      return;
    }

    if (!this._roleCache[this._UNVERIFIED_ROLE]) {
      return;
    }

    await member.addRole(<Role>this._roleCache[this._UNVERIFIED_ROLE]).then(() => {
      this._pingUserInVerify(member);
      this.container.messageService.sendBotReport(
        `User \`${member.user.tag}\` has been automatically unverified`
      );
    });
  }

  private _pingUserInVerify(member: GuildMember) {
    if (!this._VERIFY_CHANNEL) {
      this._VERIFY_CHANNEL = this.container.guildService
        .get()
        .channels.filter((chan: GuildChannel) => chan.name === Constants.Channels.Bot.Verify)
        .first() as TextChannel;
    }

    this._VERIFY_CHANNEL.send(member.user.toString()).then((sentMsg) => {
      (sentMsg as Message).delete(1000 * 60 * 60 * 12); //Delete after 12 hours
    });
  }
}
