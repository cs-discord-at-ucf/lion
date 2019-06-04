import { PluginLoader } from '../bootstrap/plugin.loader';
import { IPlugin } from '../common/types';

export class PluginService {
  public plugins: { [pluginName: string]: IPlugin } = {};

  get(pluginName: string): IPlugin {
    return this.plugins[pluginName];
  }

  register(pluginName: string, args?: any): IPlugin {
    if (this.plugins[pluginName]) {
      throw new Error(`${pluginName} already exists as a plugin.`);
    }
    return (this.plugins[pluginName] = new PluginLoader(pluginName, args) as IPlugin);
  }
}
