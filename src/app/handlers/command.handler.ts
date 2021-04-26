import { IMessage, IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';

export class CommandHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const command = this.build(message.content);
    const plugins = this.container.pluginService.plugins;
    const aliases = this.container.pluginService.aliases;

    //checks to see if the user is actually talking to the bot
    if (!command) {
      return;
    }

    const plugin = plugins[aliases[command.name]];

    const isDM = !message.guild;

    if (plugin) {
      if ((isDM && !plugin.usableInDM) || (!isDM && !plugin.usableInGuild)) {
        return;
      }

      if (!isDM && !plugin.hasPermission(message)) {
        return;
      }

      if (!plugin.validate(message, command.args)) {
        message.reply(`Invalid arguments! Try: \`${Constants.Prefix}${plugin.usage}\``);
        return;
      }

      try {
        this.container.loggerService.info(
          JSON.stringify({ event: 'starting', plugin: plugin.name, args: command.args })
        );
        await plugin.execute(message, command.args);
        this.container.loggerService.info(
          JSON.stringify({ event: 'fulfill', plugin: plugin.name, args: command.args })
        );
      } catch (e) {
        this.container.loggerService.error(
          JSON.stringify({ event: 'error', plugin: plugin.name, args: command.args, error: e })
        );
      }
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
