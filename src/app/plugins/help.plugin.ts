import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IPluginHelp } from '../../common/types';
import Constants from '../../common/constants';
import { MessageEmbed, TextChannel } from 'discord.js';

export class HelpPlugin extends Plugin {
  public name: string = 'Help Plugin';
  public description: string = 'Displays supported commands and usage statements.';
  public usage: string = 'help [Plugin Command]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.All;

  private readonly NUM_DISPLAY = 10;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const commands = this.container.pluginService.aliases;
    const input: string = this._parseCommand(args || []);

    if (commands[input]) {
      const pluginName = commands[input];
      message.reply(this._generatePluginEmbed(pluginName));
      return;
    }

    if (input === 'all') {
      this.container.messageService.sendPagedEmbed(message, this._generateEmbed(message, 'adv'));
      return;
    }

    this.container.messageService.sendPagedEmbed(message, this._generateEmbed(message, 'basic'));
  }

  private _generateEmbed(message: IMessage, type: string) {
    const currentChanPerm = this.container.channelService.getChannelType(
      (message.channel as TextChannel).name
    );

    const plugins = Object.keys(this.container.pluginService.plugins).filter((p: string) => {
      const plugin = this.container.pluginService.get(p);

      if (plugin.pluginChannelName) {
        return plugin.pluginChannelName === (message.channel as TextChannel).name;
      }

      // Filter out plugins that don't work in current channel
      return plugin.permission === currentChanPerm;
    });

    const numPages = Math.ceil(plugins.length / this.NUM_DISPLAY);

    // Create pages and return
    return [...new Array(numPages)].map(() => {
      const page = new MessageEmbed();
      page.setColor('#0099ff').setTitle('**__These are the commands I support__**');

      for (const targName of plugins.splice(0, this.NUM_DISPLAY)) {
        const plugin = this.container.pluginService.get(targName);
        const aliases = plugin.pluginAlias || [];
        const altCalls = `aliases: ${aliases.length != 0 ? aliases.join(', ') : 'None'} \n`;

        page.addField(
          `${Constants.Prefix}${plugin.usage}`,
          `${type == 'adv' ? altCalls : ''}${plugin.description}`
        );
      }
      return page;
    });
  }

  private _generatePluginEmbed(targ: string) {
    const plugin = this.container.pluginService.plugins[targ];
    const aliases = plugin.pluginAlias || [];

    // Single Plugins are not paged
    const targEmbed = new MessageEmbed();
    const altCalls = `aliases: ${aliases.length != 0 ? aliases.join(', ') : 'None'} \n`;

    targEmbed.setColor('#0099ff').setTitle(`**__${plugin.name}__**`);
    targEmbed.addField(`${Constants.Prefix}${plugin.usage}`, `${altCalls}${plugin.description}`);

    return targEmbed;
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
