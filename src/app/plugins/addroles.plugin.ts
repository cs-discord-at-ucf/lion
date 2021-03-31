import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class AddRolesPlugin extends Plugin {
  public name: string = 'Add Roles Plugin';
  public description: string = 'Adds roles to user.';
  public usage: string = 'addroles <role> [...roles]';
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
      message.reply('Could not resolve you to a member');
      return;
    }

    const roles_added: string[] = [];
    for (const elem of args) {
      const role = this.container.guildService
        .get()
        .roles.cache.find((r) => r.name.toLowerCase() === elem.toLowerCase());
      if (!role) continue;
      try {
        await member.roles.add(role);
        roles_added.push(role.name);
      } catch (err) {
        this.container.loggerService.error(
          `User ${member.user.tag} attempted to add the role ${elem} but failed: ${err}`
        );
      }
    }
    if (roles_added.length <= 0) {
      message.reply(`Nothing was added successfully.`);
    } else {
      message.reply(`Successfully added: ${roles_added.join(', ')}`);
    }
  }
}
