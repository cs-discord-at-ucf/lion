import { GuildMember } from 'discord.js';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class UserUpdateHandler extends Handler {
  public name: string = 'UserUpdate';

  constructor(public container: IContainer) {
    super();
  }

  public execute(oldUser: GuildMember, newUser: GuildMember): void {
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
