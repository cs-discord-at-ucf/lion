import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class DelRolesPlugin extends Plugin {
  public name: string = 'Roles Plugin';
  public description: string = 'Removes roles from user.';
  public usage: string = 'delroles <role> [...roles]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (!args || args.length <= 0) {
      message.reply('No arguments; nothing to do.');
      return;
    }
    const roles_deleted: string[] = [];
    for (const elem of args) {
      const role = message.member.roles.find((r) => r.name.toLowerCase() === elem.toLowerCase());
      if (!role) continue;
      try {
        await message.member.removeRole(role);
        roles_deleted.push(role.name);
      } catch (err) {
        this.container.loggerService.error(
          `User ${message.member.user.tag} attempted to remove the role ${elem} but failed: ${err}`
        );
      }
    }
    if (roles_deleted.length <= 0) {
      message.reply('Nothing deleted successfully.');
    } else {
      message.reply(`Successfully deleted: ${roles_deleted.join(', ')}`);
    }
  }
}
