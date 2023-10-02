import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { commands } from '../../common/slash';
import * as types from '../../common/types';

export class CommandHandler extends Handler {
  public name: string = 'Command';

  constructor(public container: types.IContainer) {
    super();
  }

  public async execute(message: types.IMessage): Promise<void> {
    const command = this.build(message.content);

    // checks to see if the user is actually talking to the bot
    if (!command) {
      return;
    }

    if (message.mentions?.everyone) {
      message.reply('You cannot use a plugin, while pinging everyone.');
      return;
    }

    // Check if a slash command of the same name exists, if so redirect to it
    const slashCommand = commands.get(command.name);
    if (slashCommand) {
      const cachedCommand = this.container.guildService
        .get()
        .commands.cache.find((c) => c.name === command.name)!;

      await message.reply(
        `The command \`!${command.name}\` has been migrated to a slash command, please use </${cachedCommand.name}:${cachedCommand.id}> instead.`
      );
      return;
    }
  }

  build(content: string): types.Maybe<types.ICommand> {
    if (content.charAt(0) !== Constants.Prefix) {
      return undefined;
    }

    const messageArr = content.slice(1).split(' ');
    const name = messageArr[0].toLowerCase();
    const args = messageArr.slice(1).filter(Boolean);
    return { name, args };
  }
}
