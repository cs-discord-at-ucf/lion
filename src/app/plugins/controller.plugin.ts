import { EmbedBuilder } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, ChannelGroup, IMessage, RoleType, IRunnable } from '../../common/types';

export default class PluginControl extends Plugin {
  public commandName: string = 'controller';
  public name: string = 'controller';
  public description: string = 'Controls activating and deactivating plugins.';
  public usage: string =
    'controller <activate|deactivate> <plugin|job|handler> <runnable name>\n' +
    'controller list <plugin|job|handler>';
  public permission: ChannelGroup = ChannelGroup.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override minRoleToRun: RoleType = RoleType.Admin;

  public override commandPattern: RegExp = /^(deactivate|activate|list) (job|plugin|handler)[\w ]*/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]): Promise<void> {
    const [method, type, ...nameArray] = args;
    const state = method.toLowerCase() === 'activate';
    const name = nameArray.join(' ');

    if (method.toLowerCase() === 'list') {
      await this._listStatuses(message, type);
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
      if (name.toLowerCase() === 'command') {
        message.reply('You cannot turn of the command handler');
        return;
      }

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

  private _listStatuses(message: IMessage, type: string): Promise<IMessage> {
    let runnables: IRunnable[] = [];
    if (type === 'plugin') {
      runnables = Object.values(this.container.pluginService.plugins);
    } else if (type === 'job') {
      runnables = Object.values(this.container.jobService.jobs);
    } else if (type === 'handler') {
      runnables = this.container.handlerService.getAllHandlers();
    }

    const inactive = runnables.filter((r) => !r.isActive);

    const embed = new EmbedBuilder();
    embed.setTitle('Plugin Statuses');
    embed.setThumbnail(Constants.LionPFP);

    embed.addFields([
      { name: `Number of ${type}s`, value: `${runnables.length}` },
      { name: `Number of inactive ${type}s`, value: `${inactive.length}` },
    ]);

    if (inactive.length) {
      embed.addFields({ name: `Inactive ${type}s`, value: inactive.map((p) => p.name).join('\n') });
    }

    return message.reply({ embeds: [embed] });
  }
}
