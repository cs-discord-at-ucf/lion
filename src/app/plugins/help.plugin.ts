import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IPluginHelp, IPlugin } from '../../common/types';
import Constants from '../../common/constants';
import { RichEmbed } from 'discord.js';

export class HelpPlugin extends Plugin {
  public name: string = 'Help Plugin';
  public description: string = 'Displays supported commands and usage statements.';
  public usage: string = 'help [Plugin Command]';
  public pluginCommands = [];
  public permission: ChannelType = ChannelType.Bot;
  private _embed: RichEmbed[] = [];
  private _pluginEmbed: IPluginHelp = {};

  constructor(public container: IContainer) {
    super();

    this._embed[0] = new RichEmbed();
    this._embed[1] = new RichEmbed();
  }



  public async execute(message: IMessage, args?: string[]) {
    const commands = this.container.pluginService.commands
    const input: string = (args === undefined || args.length === 0) ? '' : this._parseCommand(args);

    if (!!commands[input]) {

      const pluginName = commands[input];
      const plugin = this.container.pluginService.plugins[pluginName];

      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff) {

        if (this._embed[1].fields!.length === 0) {
          this._generateEmbed(false, 1);
        }

        message.reply(this._embed[1]);

      } else {
        if (this._pluginEmbed[pluginName] === undefined) {
          this._pluginEmbed[pluginName] = new RichEmbed();
          this._generatePluginEmbed(pluginName);
        }
        message.reply(this._pluginEmbed[pluginName]);
      }
    } else if (input === "all") {
      if (this._embed[0].fields!.length === 0) {
        this._generateEmbed(true, 0);
      }

      message.reply(this._embed[0]);

    } else {

      if (this._embed[1].fields!.length === 0) {
        this._generateEmbed(false, 1);
      }

      message.reply(this._embed[1]);
    }
  }

  private _generateEmbed(all: boolean, targ: number) {
    const plugins = Object.keys(this.container.pluginService.plugins);

    this._embed[targ].setColor('#0099ff').setTitle('**__These are the commands I support__**');

    for (let i = 0; i < plugins.length; i++) {
      const plugin = this.container.pluginService.get(plugins[i]);

      const altCalls = all ? (plugin.pluginCommands.length != 0) ? "alt calls: " + plugin.pluginCommands.join(', ') + ", \n" : 'alt calls: None \n' : ''

      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff)
        continue;
      this._embed[targ].addField(`${Constants.Prefix}${plugin.usage}`, `${altCalls}${plugin.description}`);
    }
  }

  private _generatePluginEmbed(targ: string) {
    const plugin = this.container.pluginService.plugins[targ];

    this._pluginEmbed[targ].setColor('#0099ff').setTitle(`**__${plugin.name}__**`);

    const altCalls = plugin.pluginCommands.length != 0 ? "alt calls: " + plugin.pluginCommands.join(', ') + ". \n" : 'alt calls: None \n'

    this._pluginEmbed[targ].addField(`${Constants.Prefix}${plugin.usage}`, `${altCalls}${plugin.description}`);
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
