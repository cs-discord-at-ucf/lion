import { IMessage, IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';

export class CommandHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const command = this.build(message.content);
    const plugins = this.container.pluginService.plugins;
    if (!command) {
      return;
    }

    if (!!plugins[command.name]) {
      const plugin = plugins[command.name];

      if (!plugin.validate(message, command.args)) {
        message.reply(`Invalid arguments! Try: \`${Constants.Prefix}${plugin.usage}\``);
        return;
      }

      if (!plugin.hasPermission(message)) {
        return;
      }

      await plugin.execute(message, command.args);
    }
  }

  build(content: string) {
    if (content.charAt(0) !== Constants.Prefix) {
      return undefined;
    }

    const messageArr = content.slice(1).split(' ');
    const name = messageArr[0].toLowerCase();
    const args = messageArr.slice(1);
    return { name, args };
  }
}
