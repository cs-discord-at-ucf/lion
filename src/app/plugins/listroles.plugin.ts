import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { Role } from 'discord.js';

export class ListRolesPlugin extends Plugin {
  public name: string = 'Roles Plugin';
  public description: string = 'Lists all available roles.';
  public usage: string = 'listroles';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    let res = '```\n';

    const member = message.member;
    if (!member) {
      message.reply('Could not resolve you to a member');
      return;
    }

    const mp = new Map();
    for (const role of member.roles.cache) {
      mp.set(role[1].name.toLowerCase(), true);
    }

    this.container.guildService
      .get()
      .roles.cache.sort((a: Role, b: Role) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      )
      .map((role) => {
        if (mp.get(role.name.toLowerCase())) {
          res += `-- `;
        } else {
          res += `   `;
        }
        res += `${role.name.toLowerCase()}\n`;
      });
    res += '```';
    await this.container.messageService.attempDMUser(message, res);
  }
}
