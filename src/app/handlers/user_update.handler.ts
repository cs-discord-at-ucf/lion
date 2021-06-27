import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class UserUpdateHandler implements IHandler {
  constructor(public container: IContainer) {}

  public execute(oldUser: GuildMember, newUser: GuildMember): void {
    if (oldUser.displayName !== newUser.displayName) {
      this.container.messageService.sendBotReport(
        `User ${newUser.user} changed their name from \`${oldUser.displayName}\` to \`${newUser.displayName}\``
      );
    }
  }
}
