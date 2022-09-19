import { GuildMember } from 'discord.js';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class UserUpdateHandler extends Handler {
  public name: string = 'UserUpdate';
  private _boostRewardAmount: number = 5000;

  constructor(public container: IContainer) {
    super();
  }

  public execute(oldUser: GuildMember, newUser: GuildMember): void {
    this._checkNameChange(oldUser, newUser);
    this._checkBoost(oldUser, newUser);
  }

  private _checkBoost(oldUser: GuildMember, newUser: GuildMember) {
    const boosterRole = this.container.guildService.getRole(Constants.Roles.NitroBooster);
    if (oldUser.roles.cache.has(boosterRole.id) || !newUser.roles.cache.has(boosterRole.id)) {
      return;
    }

    this.container.pointService.awardPoints(newUser.id, this._boostRewardAmount);
  }

  private _checkNameChange(oldUser: GuildMember, newUser: GuildMember) {
    // Don't ping mods
    const shouldPing = !this.container.userService.hasRole(oldUser, Constants.Roles.Moderator);
    if (oldUser.displayName === newUser.displayName) {
      return;
    }

    this.container.messageService.sendBotReport(
      `User ${
        shouldPing ? newUser.user : newUser.user.tag
      } changed their name from \`${oldUser.displayName.replace(
        '`',
        "'"
      )}\` to \`${newUser.displayName.replace('`', "'")}\``
    );
  }
}
