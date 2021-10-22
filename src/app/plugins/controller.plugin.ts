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

  public override commandPattern: RegExp =
    /^(deactivate|activate|list) (job|plugin|handler) [\w ]+/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]): Promise<void> {
    const [method, type, ...nameArray] = args;
    const state = method.toLowerCase() === 'activate';
    const name = nameArray.join(' ');

    if (method.toLowerCase() === 'list') {
      await this._listStatuses(message);
      return;
    }

    if (type.toLowerCase() === 'plugin') {
      const result = await this._setPluginState(name, state);
      await message.channel.send(result);
      return;
    }
    if (type.toLowerCase() === 'job') {
      const result = await this._setJobState(name, state);
      await message.channel.send(result);
      return;
    }
    if (type.toLowerCase() === 'handler') {
      const result = await this._setHandlerState(name, state);
      await message.channel.send(result);
    }
  }

  private async _setPluginState(name: string, state: boolean): Promise<string> {
    try {
      await this.container.pluginService.setPluginState(this.container, name, state);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return `There was an error setting the state: ${e.message}`;
    }

    return `${name} has been ${state ? 'activated' : 'deactivated'}`;
  }

  private async _setJobState(name: string, state: boolean): Promise<string> {
    try {
      await this.container.jobService.setJobState(this.container, name, state);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return `There was an error setting the state: ${e.message}`;
    }

    return `${name} has been ${state ? 'activated' : 'deactivated'}`;
  }

  private async _setHandlerState(name: string, state: boolean): Promise<string> {
    try {
      await this.container.handlerService.setHandlerState(this.container, name, state);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return `There was an error setting the state: ${e.message}`;
    }

    return `${name} has been ${state ? 'activated' : 'deactivated'}`;
  }

  private _listStatuses(message: IMessage): Promise<IMessage> {
    const plugins: IPlugin[] = Object.keys(this.container.pluginService.plugins).map((p) =>
      this.container.pluginService.get(p)
    );

    const inactivePlugins = plugins.filter((p) => !p.isActive);

    const embed = new MessageEmbed();
    embed.setTitle('Plugin Statuses');
    embed.setThumbnail(Constants.LionPFP);

    embed.addField('Number of Plugins', `${plugins.length}`, true);
    embed.addField('Number of inactive plugins', `${inactivePlugins.length}`);

    if (inactivePlugins.length) {
      embed.addField(
        'Inactive Plugins',
        inactivePlugins.map((p) => p.commandName).join('\n'),
        true
      );
    }

    return message.reply({ embeds: [embed] });
  }
}
