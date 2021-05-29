import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, IPlugin } from '../../common/types';

export class PluginSearchPlugin extends Plugin {
  public name: string = 'Plugin Search';
  public description: string = 'Search our plugins database';
  public usage: string = 'search <phrase>';
  public pluginAlias = ['search', 'searchplugin', 'searchplugins'];
  public permission: ChannelType = ChannelType.Bot;
  public commandPattern: RegExp = /[^]+/;

  private readonly NUM_DISPLAY: number = 10;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const expression = args.join(' ');
    // For every plugin, evaluate it's match
    const results: IPlugin[] = [];
    Object.values(this.container.pluginService.plugins).forEach((plugin) => {
      if (this._isFuzzyMatch(plugin, expression)) {
        results.push(plugin);
      }
    });
  }

  private _isFuzzyMatch(plugin: IPlugin, expression: string): boolean {
    const pluginMeta = `
      ${plugin.name} 
      ${plugin.description} 
      ${plugin.usage}`;

    // Find greplike matches within plugin's metadata.
    const grepRegex = new RegExp(`^.*(${expression}).*$`, 'mg');
    const match = pluginMeta.match(grepRegex);

    return Boolean(match);
  }
}
