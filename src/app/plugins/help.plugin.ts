import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IPluginHelp } from '../../common/types';
import Constants from '../../common/constants';
import { RichEmbed } from 'discord.js';

export class HelpPlugin extends Plugin {
  public name: string = 'Help Plugin';
  public description: string = 'Displays supported commands and usage statements.';
  public usage: string = 'help [Plugin Command]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;
  private _embed: IPluginHelp = {};

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const commands = this.container.pluginService.aliases;
    const input: string = this._parseCommand(args || []);

    if (commands[input]) {
      const pluginName = commands[input];
      const plugin = this.container.pluginService.plugins[pluginName];

      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff) {
        // as the admin/mod commands aren't meant to be known this just shows the basic help as if nothing happened.
        if (!this._embed['basic']) {
          this._generateEmbed('basic');
        }

        message.reply(this._embed['basic']);
      } else {
        if (!this._embed[pluginName]) {
          this._embed[pluginName] = new RichEmbed();
          this._generatePluginEmbed(pluginName);
        }
        message.reply(this._embed[pluginName]);
      }
    } else if (input === 'all') {
      if (!this._embed['adv']) {
        this._embed['adv'] = new RichEmbed();
        this._generateEmbed('adv');
      }

      message.reply(this._embed['adv']);
    } else {
      if (!this._embed['basic']) {
        this._embed['basic'] = new RichEmbed();
        this._generateEmbed('basic');
      }

      message.reply(this._embed['basic']);
    }
  }

  private _generateEmbed(type: string) {
    const plugins = Object.keys(this.container.pluginService.plugins);

    this._embed[type].setColor('#0099ff').setTitle('**__These are the commands I support__**');

    for (const targName of plugins) {
      const plugin = this.container.pluginService.get(targName);
      const aliases = plugin.pluginAlias || [];
      const altCalls = `aliases: ${aliases.length != 0 ? aliases.join(', ') : 'None'} \n`;

      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff)
        continue;

      this._embed[type].addField(
        `${Constants.Prefix}${plugin.usage}`,
        `${type == 'adv' ? altCalls : ''}${plugin.description}`
      );
    }
  }

  private _generatePluginEmbed(targ: string) {
    const plugin = this.container.pluginService.plugins[targ];
    const aliases = plugin.pluginAlias || [];

    this._embed[targ].setColor('#0099ff').setTitle(`**__${plugin.name}__**`);

    const altCalls = `aliases: ${aliases.length != 0 ? aliases.join(', ') : 'None'} \n`;

    this._embed[targ].addField(
      `${Constants.Prefix}${plugin.usage}`,
      `${altCalls}${plugin.description}`
    );
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
