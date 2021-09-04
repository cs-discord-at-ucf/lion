import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, ChannelType, IMessage, RoleType, IPlugin } from '../../common/types';

export default class PluginControl extends Plugin {
  public commandName: string = 'controller';
  public name: string = 'controller';
  public description: string = 'Controls activating and deactivating plugins.';
  public usage: string = 'controller <activate | deactivate> <plugin name>';
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override minRoleToRun: RoleType = RoleType.Admin;

  public override commandPattern: RegExp = /^(deactivate|activate|list)( (?!\s*$).)*/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]): Promise<void> {
    const [method, pluginName] = args;

    if (method.toLowerCase() === 'list') {
      await this._listStatuses(message);
      return;
    }

    try {
      await this.container.pluginService.setPluginState(
        this.container,
        pluginName,
        method.toLowerCase() === 'activate'
      );
    } catch (e) {
      await message.channel.send(e.message);
      return;
    }

    message.channel.send(`${pluginName} has been ${method}d`);
  }

  private _listStatuses(message: IMessage): Promise<IMessage> {
    const plugins: IPlugin[] = Object.keys(this.container.pluginService.plugins).map((p) =>
      this.container.pluginService.get(p)
    );

    const inactivePlugins = plugins.filter((p) => !p.isActive);

    const embed = new MessageEmbed();
    embed.setTitle('Plugin Statuses');
    embed.setThumbnail(Constants.LionPFP);

    embed.addField('Number of Plugins', plugins.length, true);
    embed.addField('Number of inactive plugins', inactivePlugins.length);

    if (inactivePlugins.length) {
      embed.addField(
        'Inactive Plugins',
        inactivePlugins.map((p) => p.commandName).join('\n'),
        true
      );
    }

    return message.reply(embed);
  }
}
