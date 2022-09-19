import { MessageEmbed } from 'discord.js';
import Constants from '../common/constants';
import { Plugin } from '../common/plugin';
import { IPlugin, ICommandLookup, IPluginLookup, IContainer } from '../common/types';

export interface IPluginState {
  name: string;
  isActive: boolean;
  guildID: string;
}

export type PluginStateDocument = IPluginState & Document;

export class PluginService {
  public plugins: IPluginLookup = {};
  public aliases: ICommandLookup = {};

  private readonly _NUM_DISPLAY = 5;

  public initPluginStates(container: IContainer): Promise<void> {
    return container.controllerService.initRunnableStates(container, Object.values(this.plugins));
  }

  public setPluginState(container: IContainer, plugin: string, state: boolean): Promise<void> {
    const fetchedPlugin = this.plugins[this.aliases[plugin]];
    if (!fetchedPlugin) {
      throw new Error(`Could not find plugin named \'${plugin}\'`);
    }

    return container.controllerService.setRunnableState(container, fetchedPlugin, state);
  }

  get(pluginName: string): IPlugin {
    return this.plugins[pluginName];
  }

  register(plugin: Plugin) {
    if (this.plugins[plugin.commandName]) {
      throw new Error(`${plugin.commandName} already exists as a plugin.`);
    }

    this.plugins[plugin.commandName] = plugin;
    this.registerAliases(plugin.commandName);

    return plugin;
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
      page.setColor('#0099ff').setTitle('**__These are the commands I support in this channel__**');

      for (const plugin of plugins.splice(0, this._NUM_DISPLAY)) {
        const aliases = plugin.pluginAlias ?? [];
        const altCalls = `\nAliases: ${aliases.length !== 0 ? aliases.join(', ') : 'None'} \n`;

        const usages = plugin.usage.split('\n');

        // Poll is the only exception where args are required on new lines
        const shouldAddPrefixes = !['poll', 'alt'].includes(plugin.commandName);

        // Put a ! infront of every usage on new line
        const withPrefix = `${Constants.Prefix}${usages.join(
          `\n${shouldAddPrefixes ? Constants.Prefix : ''}`
        )}`;
        const formattedUsage = `\`\`\`\n${withPrefix}\n\`\`\``;

        page.addField(
          `${Constants.Prefix}${plugin.commandName}`,
          `${plugin.description}\n${formattedUsage}` + `${type === 'adv' ? altCalls : ''}`
        );
      }
      return page;
    });
  }
}
