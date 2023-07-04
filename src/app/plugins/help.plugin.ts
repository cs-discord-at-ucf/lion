import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup, RoleType } from '../../common/types';
import Constants from '../../common/constants';
import { EmbedBuilder } from 'discord.js';

export default class HelpPlugin extends Plugin {
  public commandName: string = 'help';
  public name: string = 'Help Plugin';
  public description: string = 'Displays supported commands and usage statements.';
  public usage: string = 'help\nhelp <commandName>';
  public override pluginAlias = [];
  public permission: ChannelGroup = ChannelGroup.All;
  public override minRoleToRun = RoleType.Suspended;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const commands = this.container.pluginService.aliases;
    const input: string = this._parseCommand(args ?? []);

    if (commands[input]) {
      const pluginName = commands[input];
      await message.reply({ embeds: [this._generatePluginEmbed(pluginName)] });
      return;
    }

    if (input === 'all') {
      await this.container.messageService.sendPagedEmbed(message, this._getEmbed(message, 'adv'));
      return;
    }

    this.container.messageService.sendPagedEmbed(message, this._getEmbed(message, 'basic'));
  }

  private _getEmbed(message: IMessage, type: string) {
    const plugins = Object.keys(this.container.pluginService.plugins).filter((p: string) => {
      const plugin = this.container.pluginService.get(p);
      return plugin.hasPermission(message) === true && plugin.isActive;
    });

    return this.container.pluginService.generateHelpEmbeds(plugins, type);
  }

  private _generatePluginEmbed(targ: string) {
    const plugin = this.container.pluginService.plugins[targ];
    const aliases = plugin.pluginAlias ?? [];

    // Single Plugins are not paged
    const targEmbed = new EmbedBuilder();
    const altCalls = `aliases: ${aliases.length !== 0 ? aliases.join(', ') : 'None'} \n`;

    targEmbed.setColor('#0099ff').setTitle(`**__${plugin.name}__**`);
    targEmbed.addFields({
      name: `${Constants.Prefix}${plugin.usage}`,
      value: `${altCalls}${plugin.description}`,
    });

    return targEmbed;
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
