import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';
import { RichEmbed } from 'discord.js';

export class HelpPlugin extends Plugin {
  public name: string = 'Help Plugin';
  public description: string = 'Displays supported commands and usage statements.';
  public usage: string = 'help';
  public permission: ChannelType = ChannelType.Bot;
  private _embed: RichEmbed = new RichEmbed();
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (this._embed.fields!.length === 0) {
      this._generateEmbed();
    }
    message.reply(this._embed);
  }

  private _generateEmbed() {
    const plugins = Object.keys(this.container.pluginService.plugins);

    this._embed.setColor('#0099ff').setTitle('**__These are the commands I support__**');

    for (let i = 0; i < plugins.length; i++) {
      const plugin = this.container.pluginService.get(plugins[i]);
      if (plugin.permission === ChannelType.Admin || plugin.permission === ChannelType.Staff)
        continue;
      this._embed.addField(`${Constants.Prefix}${plugin.usage}`, `${plugin.description}`);
    }
  }
}
