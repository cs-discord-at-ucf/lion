import * as types from '../../common/types';
import Constants from '../../common/constants';
import levenshtein from 'js-levenshtein';
import { MessageEmbed, MessageReaction, User } from 'discord.js';
import ms from 'ms';
import { Handler } from '../../common/handler';
import { commands } from '../../common/slash';

export class CommandHandler extends Handler {
  public name: string = 'Command';
  private _CHECK_EMOTE = '✅';
  private _CANCEL_EMOTE = '❎';

  constructor(public container: types.IContainer) {
    super();
  }

  public async execute(message: types.IMessage): Promise<void> {
    const command = this.build(message.content);
    const plugins = this.container.pluginService.plugins;
    const aliases = this.container.pluginService.aliases;

    // checks to see if the user is actually talking to the bot
    if (!command) {
      return;
    }

    if (message.mentions?.everyone) {
      message.reply('You cannot use a plugin, while pinging everyone.');
      return;
    }

    const plugin = plugins[aliases[command.name]];
    const isDM = !message.guild;

    if (plugin) {
      await this._attemptRunPlugin(message, plugin, command, isDM);
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

    await this._tryFuzzySearch(message, command, isDM);
  }

  private async _tryFuzzySearch(message: types.IMessage, command: types.ICommand, isDM: boolean) {
    const { plugins, aliases } = this.container.pluginService;
    const allNames = Array.from(Object.keys(this.container.pluginService.aliases));

    const validCommandsInChannel = allNames.filter((name) => {
      const plugin = plugins[aliases[name]];
      return plugin.hasPermission(message) === true;
    });

    const [mostLikelyCommand] = validCommandsInChannel.sort(
      (a: string, b: string) => levenshtein(command.name, a) - levenshtein(command.name, b)
    );

    const embed = new MessageEmbed();
    embed.setTitle('Command not found');
    embed.setDescription(
      'Did you mean `!' +
        `${mostLikelyCommand}${command.args.length ? ' ' : ''}${command.args.join(' ')}\`?\n` +
        'React with ✅ to run this command.\n' +
        'React with ❎ to close this offering.'
    );

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react(this._CHECK_EMOTE);
    await msg.react(this._CANCEL_EMOTE);

    const collector = msg.createReactionCollector(
      {
        filter: (reaction: MessageReaction, user: User) =>
          [this._CHECK_EMOTE, this._CANCEL_EMOTE].includes(reaction.emoji.name!) &&
          user.id !== msg.author.id, // Only run if its not the bot putting reacts
        time: ms('10m'),
      } // Listen for 10 Minutes
    );

    // Delete message after collector is finished
    collector.on('end', () => {
      if (msg.deletable) {
        msg.delete().catch(() => {});
      }
    });

    collector.on('collect', async (reaction: MessageReaction) => {
      const lastUserToReact = reaction.users.cache.last();

      // If the person reacting wasn't the original sender
      if (lastUserToReact !== message.author) {
        // Delete the reaction
        await reaction.users.remove(lastUserToReact);
        return;
      }

      if (reaction.emoji.name === this._CANCEL_EMOTE) {
        await msg.delete().catch();
        return;
      }

      const mostLikelyPlugin = plugins[aliases[mostLikelyCommand]];
      await this._attemptRunPlugin(message, mostLikelyPlugin, command, isDM);
      await msg.delete().catch();
    });
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

  private async _attemptRunPlugin(
    message: types.IMessage,
    plugin: types.IPlugin,
    command: types.ICommand,
    isDM: boolean
  ) {
    if ((isDM && !plugin.usableInDM) || (!isDM && !plugin.usableInGuild)) {
      return;
    }

    const permissionResponse = plugin.hasPermission(message);
    if (!isDM && permissionResponse !== true) {
      message.reply(permissionResponse);
      return;
    }

    if (!plugin.validate(message, command.args)) {
      await message.reply(`Invalid arguments! Try: \`${Constants.Prefix}${plugin.usage}\``);
      return;
    }

    if (!plugin.isActive) {
      await message.reply('This plugin has been deactivated.');
      return;
    }

    const pEvent: types.IPluginEvent = {
      status: 'starting',
      pluginName: plugin.name,
      args: command.args,
      user: message.author.tag,
    };

    try {
      this.container.loggerService.info(JSON.stringify(pEvent));
      await plugin.execute(message, command.args);

      pEvent.status = 'fulfillCommand';
      this.container.loggerService.info(JSON.stringify(pEvent));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      pEvent.status = 'error';
      pEvent.error = e.message as string;
      pEvent.stack = e.stack as string;
      this.container.loggerService.error(JSON.stringify(pEvent));
    }
  }
}
