import { PluginLoader } from '../bootstrap/plugin.loader';
import { IPlugin, ICommandLookup, IPluginLookup } from '../common/types';

export class PluginService {
  public plugins: IPluginLookup = {};
  public aliases: ICommandLookup = {};

  get(pluginName: string): IPlugin {
    return this.plugins[pluginName];
  }

  register(pluginName: string, args?: any): IPlugin {
    if (this.plugins[pluginName]) {
      throw new Error(`${pluginName} already exists as a plugin.`);
    }

    const reference = (this.plugins[pluginName] = new PluginLoader(pluginName, args) as IPlugin);

    this.registerAliases(pluginName);

    return reference;
  }

  registerAliases(pluginName: string, _args?: any): void {
    const aliases = this.plugins[pluginName].pluginAlias;

    if (aliases === undefined) {
      this.aliases[pluginName] = pluginName;
    } else {
      if (!aliases.includes(pluginName)) {
        if (this.aliases[pluginName] !== undefined) {
          throw new Error(
            `Duplicate alias detected: ${pluginName} is claiming its primary alias ${pluginName}, prevouisly claimed by ${this.aliases[pluginName]}.`
          );
        }
        this.aliases[pluginName] = pluginName;
      }

      aliases.forEach((alias: string) => {
        if (this.aliases[alias] !== undefined && this.aliases[alias] !== pluginName) {
          throw new Error(
            `Duplicate alias detected: ${pluginName} is trying to claim ${alias}, but ${this.aliases[alias]} has already claimed it.`
          );
        }
        this.aliases[alias] = pluginName;
      });
    }
  }
}
