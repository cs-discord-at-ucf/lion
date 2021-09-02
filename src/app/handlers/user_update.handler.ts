import { GuildMember } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler } from '../../common/types';

export class UserUpdateHandler implements IHandler {
  constructor(public container: IContainer) {}

  public execute(oldUser: GuildMember, newUser: GuildMember): void {
    // Don't ping mods

    const shouldPing = !this.container.userService.hasRole(oldUser, Constants.Roles.Moderator);
    if (oldUser.displayName === newUser.displayName) {
      return;
    }

    this.container.messageService.sendBotReport(
      `User ${shouldPing ? newUser.user : newUser.user.tag} changed their name from \`${
        oldUser.displayName
      }\` to \`${newUser.displayName}\``
    );
  }
}
