import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class DelRolesPlugin extends Plugin {
  public commandName: string = 'delroles';
  public name: string = 'Roles Plugin';
  public description: string = 'Removes roles from user.';
  public usage: string = 'delroles <role> [...roles]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  public async execute(message: IMessage, args: string[]) {
    const member = message.member;
    if (!member) {
      await message.reply('Could not resolve you to a member');
      return;
    }

    const roles_deleted: string[] = [];
    for (const elem of args) {
      const role = member.roles.cache.find((r) => r.name.toLowerCase() === elem.toLowerCase());
      if (!role) {continue;}
      try {
        await member.roles.remove(role);
        roles_deleted.push(role.name);
      } catch (err) {
        this.container.loggerService.error(
          `User ${member.user.tag} attempted to remove the role ${elem} but failed: ${err}`
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
