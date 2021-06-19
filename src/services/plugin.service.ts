import { MessageEmbed } from 'discord.js';
import { PluginLoader } from '../bootstrap/plugin.loader';
import Constants from '../common/constants';
import { Plugin } from '../common/plugin';
import { IPlugin, ICommandLookup, IPluginLookup, IContainer } from '../common/types';
import { StorageService } from './storage.service';

export interface IPluginState {
  name: string;
  isActive: boolean;
}

export class PluginService {
  public plugins: IPluginLookup = {};
  public aliases: ICommandLookup = {};
  private _pluginState?: IPluginState[] = undefined;

  private readonly _NUM_DISPLAY = 10;

  public async initPluginState(container: IContainer): Promise<void> {
    if (this._pluginState) {
      return;
    }

    const stateCollection = (await container.storageService.getCollections()).pluginState;
    this._pluginState = await stateCollection?.find().toArray();
  }

  get(pluginName: string): IPlugin {
    return this.plugins[pluginName];
  }

  async register(pluginName: string, container: IContainer): Promise<IPlugin> {
    if (this.plugins[pluginName]) {
      throw new Error(`${pluginName} already exists as a plugin.`);
    }

    const reference = new PluginLoader(
      pluginName,
      container
    ) as IPlugin;

    try {
      const state = this._pluginState?.find(plugin => plugin.name === reference.name);
      if (state) {
        reference.isActive = state.isActive;
      }
    } catch(error) {
      console.log(error);
    }

    this.plugins[pluginName] = reference;
    this.registerAliases(pluginName);

    return reference;
  }

  registerAliases(pluginName: string): void {
    const aliases = this.plugins[pluginName].pluginAlias;

    if (!aliases) {
      this.aliases[pluginName] = pluginName;
    } else {
      if (!aliases.includes(pluginName)) {
        if (this.aliases[pluginName]) {
          throw new Error(
            `Duplicate alias detected: ${pluginName} is claiming its primary alias ${pluginName}, previously claimed by ${this.aliases[pluginName]}.`
          );
        }
        this.aliases[pluginName] = pluginName;
      }

      aliases.forEach((alias: string) => {
        if (this.aliases[alias] && this.aliases[alias] !== pluginName) {
          throw new Error(
            `Duplicate alias detected: ${pluginName} is trying to claim ${alias}, but ${this.aliases[alias]} has already claimed it.`
          );
        }
        this.aliases[alias] = pluginName;
      });
    }
  }

  public reset() {
    this.plugins = {};
    this.aliases = {};
  }

  public generateHelpEmbeds(pluginNames: string[], type: string) {
    const plugins = pluginNames.map((pluginName) => this.get(pluginName));

    const numPages = Math.ceil(plugins.length / this._NUM_DISPLAY);

    // Create pages and return
    return [...new Array(numPages)].map(() => {
      const page = new MessageEmbed();
      page.setColor('#0099ff').setTitle('**__These are the commands I support__**');

      for (const plugin of plugins.splice(0, this._NUM_DISPLAY)) {
        const aliases = plugin.pluginAlias || [];
        const altCalls = `aliases: ${aliases.length !== 0 ? aliases.join(', ') : 'None'} \n`;

        page.addField(
          `${Constants.Prefix}${plugin.usage}`,
          `${type === 'adv' ? altCalls : ''}${plugin.description}`
        );
      }
      return page;
    });
  }

  public setPluginState(plugin: string, active: boolean): IPlugin {
    const fetchedPlugin = this.plugins[this.aliases[plugin]];

    if (!fetchedPlugin) {
      throw new Error(`Could not find plugin named \'${plugin}\'`);
    }

    if (fetchedPlugin.isActive === active) {
      throw new Error(`This plugin is already ${active ? 'activated' : 'deactivated'}`);
    }

    fetchedPlugin.isActive = active;
    return fetchedPlugin;
  }
}
