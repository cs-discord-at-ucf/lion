import { Role } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, RoleType } from '../../common/types';
import AddRolesPlugin from './addroles.plugin';

export default class DelRolesPlugin extends Plugin {
  public commandName: string = 'delroles';
  public name: string = 'Roles Plugin';
  public description: string = 'Removes roles from user.';
  public usage: string = 'delroles <role> [...roles]';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;
  public override minRoleToRun = RoleType.Suspended;

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  public async execute(message: IMessage, args: string[]) {
    const member = message.member;
    if (!member) {
      await message.reply('Could not resolve you to a member');
      return;
    }

    const filteredRoles = args
      .map((name) => name.toLowerCase())
      .filter((roleName) => !AddRolesPlugin.BLACKLISTED_ROLES.includes(roleName)) // Make sure not in blacklist
      .map((roleName) => member.roles.cache.find((r) => r.name.toLowerCase() === roleName))
      .filter((role) => Boolean(role)) as Role[];

    await Promise.all(filteredRoles.map((role) => member.roles.remove(role)));

    if (filteredRoles.length <= 0) {
      message.reply('Nothing deleted successfully.');
    } else {
      message.reply(`Successfully deleted: ${filteredRoles.map((r) => r.name).join(', ')}`);
    }
  }
}
