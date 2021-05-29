import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, IPlugin } from '../../common/types';

export class PluginSearchPlugin extends Plugin {
  public name: string = 'Plugin Search';
  public description: string = 'Search our plugins database';
  public usage: string = 'search <phrase>';
  public pluginAlias = ['search', 'searchplugin', 'searchplugins'];
  public permission: ChannelType = ChannelType.Bot;
  public commandPattern: RegExp = /[^]+/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const query = args.join(' ');
    // For every plugin, evaluate it's match
    const results: string[] = [];
    Object.entries(this.container.pluginService.plugins).forEach(([pluginName, plugin]) => {
      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff) {
        return;
      }
      if (this._grep(plugin, query)) {
        results.push(pluginName);
      }
    });

    if (!results.length) {
      message.reply(`I couldn't find any results for that query.`);
      return;
    }

    const embeds = this.container.pluginService.generateHelpEmbeds(results, 'adv');
    embeds.forEach((embed) =>
      embed.setTitle('**__I found the following commands matching your search__**')
    );
    this.container.messageService.sendPagedEmbed(message, embeds);
  }

  private _grep(plugin: IPlugin, query: string): boolean {
    const pluginMeta = `
      ${plugin.name.toLowerCase()}
      ${plugin.description.toLowerCase()}
      ${plugin.usage.toLowerCase()}
      ${plugin.pluginAlias?.join(' ')}`.toLowerCase();

    // Find greplike matches within plugin's metadata.
    const grepRegex = new RegExp(`^.*(${query.toLowerCase()}).*$`, 'mg');
    const match = pluginMeta.match(grepRegex);

    return Boolean(match);
  }
}
