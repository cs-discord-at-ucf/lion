import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';

export class HelpPlugin extends Plugin {
  public name: string = 'Help Plugin';
  public description: string = 'Displays supported commands and usage statements.';
  public usage: string = 'help';
  public permission: ChannelType = ChannelType.Public;
  private _commandsResponse: string = '';
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (this._commandsResponse.length === 0) {
      this._generateCommandsResponse();
    }
    message.reply(`\nThese are the commands that I support:\n${this._commandsResponse}`);
  }

  private _generateCommandsResponse() {
    const plugins = Object.keys(this.container.pluginService.plugins);

    for (let i = 0; i < plugins.length; i++) {
      const plugin = this.container.pluginService.get(plugins[i]);
      if (i > 0) {
        this._commandsResponse += '\n';
      }

      this._commandsResponse += `**${plugin.name}**`;
      this._commandsResponse += ` - `;
      this._commandsResponse += `${plugin.description}`;
      this._commandsResponse += ` - `;
      this._commandsResponse += `\`${Constants.Prefix}${plugin.usage}\``;
    }
  }
}
