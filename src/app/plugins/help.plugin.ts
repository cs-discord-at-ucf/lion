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
  private _embed: RichEmbed[] = [];
  private _pluginEmbed: IPluginHelp = {};

  constructor(public container: IContainer) {
    super();

    this._embed[0] = new RichEmbed();
    this._embed[1] = new RichEmbed();
  }

  public async execute(message: IMessage, args?: string[]) {
    const commands = this.container.pluginService.aliases;
    const input: string = this._parseCommand(args || []);

    if (commands[input]) {
      const pluginName = commands[input];
      const plugin = this.container.pluginService.plugins[pluginName];

      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff) {
        // as the admin/mod commands aren't meant to be known this just shows the basic help as if nothing happened.
        if (this._embed[0].fields!.length === 0) {
          this._generateEmbed(0);
        }

        message.reply(this._embed[0]);
      } else {
        if (this._pluginEmbed[pluginName] === undefined) {
          this._pluginEmbed[pluginName] = new RichEmbed();
          this._generatePluginEmbed(pluginName);
        }
        message.reply(this._pluginEmbed[pluginName]);
      }
    } else if (input === 'all') {
      if (this._embed[1].fields!.length === 0) {
        this._generateEmbed(1);
      }

      message.reply(this._embed[1]);
    } else {
      if (this._embed[0].fields!.length === 0) {
        this._generateEmbed(0);
      }

      message.reply(this._embed[0]);
    }
  }

  private _generateEmbed(targ: number) {
    const plugins = Object.keys(this.container.pluginService.plugins);

    this._embed[targ].setColor('#0099ff').setTitle('**__These are the commands I support__**');

    for (const targName of plugins) {
      const plugin = this.container.pluginService.get(targName);
      const aliases = plugin.pluginAlias || [];
      const altCalls = `aliases: ${aliases.length != 0 ? aliases.join(', ') : 'None'} \n`;

      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff)
        continue;

      this._embed[targ].addField(
        `${Constants.Prefix}${plugin.usage}`,
        `${targ ? altCalls : ''}${plugin.description}`
      );
    }
  }

  private _generatePluginEmbed(targ: string) {
    const plugin = this.container.pluginService.plugins[targ];
    const aliases = plugin.pluginAlias || [];

    this._pluginEmbed[targ].setColor('#0099ff').setTitle(`**__${plugin.name}__**`);

    const altCalls = `aliases: ${aliases.length != 0 ? aliases.join(', ') : 'None'} \n`;

    this._pluginEmbed[targ].addField(
      `${Constants.Prefix}${plugin.usage}`,
      `${altCalls}${plugin.description}`
    );
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
