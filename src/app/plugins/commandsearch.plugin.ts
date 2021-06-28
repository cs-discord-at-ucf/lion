import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, IPlugin } from '../../common/types';

export default class CommandSearchPlugin extends Plugin {
  public commandName: string = 'commands';
  public name: string = 'Command Search';
  public description: string = 'Search our commands on a key word or phrase';
  public usage: string = 'commands <word or phrase>';
  public pluginAlias = ['searchcommands', 'grep'];
  public permission: ChannelType = ChannelType.Bot;
  public commandPattern: RegExp = /[^]+/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const query = args.join(' ');

    // For every plugin, evaluate it's match
    const results = Object.entries(this.container.pluginService.plugins).reduce(
      (results: string[], [pluginName, plugin]) => {
        if (
          plugin.permission === ChannelType.Admin ||
          plugin.permission === ChannelType.Staff ||
          !this._grep(plugin, query)
        ) {
          return results;
        }

        results.push(pluginName);
        return results;
      },
      []
    );

    if (!results.length) {
      await message.reply('I couldn\'t find any results for that query.');
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
      name: ${plugin.name}
      description: ${plugin.description}
      usage: ${plugin.usage}
      aliases: ${plugin.pluginAlias?.join(' ')}`;

    // We don't store '!' in metadata, strip them from query
    const queryWithoutBangs = query.replace(/!/g, '');

    // Find greplike matches within plugin's metadata.
    const grepRegex = new RegExp(`^.*(${queryWithoutBangs}).*$`, 'mgi');
    const match = pluginMeta.match(grepRegex);

    return Boolean(match);
  }
}
