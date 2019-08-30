import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { Role } from 'discord.js';

export class ListRolesPlugin extends Plugin {
  public name: string = 'Roles Plugin';
  public description: string = 'Lists all available roles.';
  public usage: string = 'listroles';
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    let res = '```\n';

    const mp = new Map();
    for (const role of message.member.roles) {
      mp.set(role[1].name.toLowerCase(), true);
    }

    message.guild.roles
      .sort((a: Role, b: Role) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      .map((role) => {
        if (mp.get(role.name.toLowerCase())) {
          res += `-- `;
        } else {
          res += `   `;
        }
        res += `${role.name.toLowerCase()}\n`;
      });
    res += '```';
    message.reply(res);
  }
}
