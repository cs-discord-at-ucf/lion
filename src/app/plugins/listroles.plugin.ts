import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { Role } from 'discord.js';

export default class ListRolesPlugin extends Plugin {
  public commandName: string = 'listroles';
  public name: string = 'Roles Plugin';
  public description: string = 'Lists all available roles.';
  public usage: string = 'listroles';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  private _BLACKLIST = ['@everyone', 'un verified', 'nitro booster'];

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    let res = '```\n';

    const member = message.member;
    if (!member) {
      await message.reply('Could not resolve you to a member');
      return;
    }

    const mp = new Map();
    for (const role of member.roles.cache) {
      mp.set(role[1].name.toLowerCase(), true);
    }

    const chatbotRole = this.container.guildService.getRole('Chatbot');
    this.container.guildService
      .get()
      .roles.cache.sort((a: Role, b: Role) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      )
      .filter((role) => !this._BLACKLIST.includes(role.name.toLowerCase())) // Not in blacklist
      .filter((role) => role.position < chatbotRole.position) // Make sure the user can add it
      .map((role) => {
        if (mp.get(role.name.toLowerCase())) {
          res += '-- ';
        } else {
          res += '   ';
        }
        res += `${role.name.toLowerCase()}\n`;
      });
    res += '```';
    await this.container.messageService.attemptDMUser(message, res);
  }
}
