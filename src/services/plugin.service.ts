import { PluginLoader } from '../bootstrap/plugin.loader';
import { IPlugin, ICommandLookup, IPluginLookup } from '../common/types';

export class PluginService {
  public plugins: IPluginLookup = {};
  public commands: ICommandLookup = {};

  get(pluginName: string): IPlugin {
    return this.plugins[pluginName];
  }

  register(pluginName: string, args?: any): IPlugin {
    if (this.plugins[pluginName]) {
      throw new Error(`${pluginName} already exists as a plugin.`);
    }

    const reference = (this.plugins[pluginName] = new PluginLoader(pluginName, args) as IPlugin);

    this.registerCommands(pluginName);

    return reference;
  }

  registerCommands(pluginName: string, args?: any): void {

    const commands = this.plugins[pluginName].pluginCommands;

    if (!commands.includes(pluginName)) {
      this.commands[pluginName] = pluginName;
    }

    commands.forEach((command: string, index: number) => {
      this.commands[command] === undefined ? this.commands[command] = pluginName : this.plugins[pluginName].pluginCommands.splice(index, 1);
    });
  }
}