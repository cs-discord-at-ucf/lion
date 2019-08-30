import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class AddRolesPlugin extends Plugin {
  public name: string = 'Add Roles Plugin';
  public description: string = 'Adds roles to user.';
  public usage: string = 'addroles <role> [...roles]';
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (!args || args.length <= 0) {
      message.reply('No arguments; nothing to do.');
      return;
    }
    const roles_added: string[] = [];
    for (const elem of args) {
      const role = message.guild.roles.find((r) => r.name.toLowerCase() === elem.toLowerCase());
      if (!role) continue;
      try {
        await message.member.addRole(role);
        roles_added.push(role.name);
      } catch (err) {
        console.error(
          `User ${message.member.user.tag} attempted to add the role ${elem} but failed: ${err}`
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
