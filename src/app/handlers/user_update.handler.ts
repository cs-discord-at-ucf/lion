import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class UserUpdateHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(oldUser: GuildMember, newUser: GuildMember): Promise<void> {
    if (oldUser.displayName !== newUser.displayName) {
      this.container.messageService.sendBotReport(
        `User \`${newUser.user.tag}\` changed their name from \`${oldUser.displayName}\` to \`${newUser.displayName}\``
      );
    }
  }
}
