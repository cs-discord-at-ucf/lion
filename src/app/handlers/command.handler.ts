import * as types from '../../common/types';
import Constants from '../../common/constants';
import levenshtein from 'js-levenshtein';
import { CommandInteraction, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import moment from 'moment';
import ISlashPlugin from '../../common/slash';

type CommandResolvable = {
  type: 'message';
  message: types.IMessage;
  plugin: types.IPlugin;
  command: types.ICommand;
  isDM: boolean;
} | {
  type: 'interaction';
  message: CommandInteraction;
  plugin: types.IPlugin;
  isDM: boolean;
};

export class CommandHandler implements types.IHandler {
  private _CHECK_EMOTE = '✅';
  private _CANCEL_EMOTE = '❎';

  constructor(public container: types.IContainer) {}

  public async execute(message: types.IMessage | CommandInteraction): Promise<void> {
    const plugins = this.container.pluginService.plugins;
    const aliases = this.container.pluginService.aliases;

    let plugin;

    if (message instanceof CommandInteraction) {
      plugin = plugins[aliases[message.commandName]];
    } else {
      if (message.mentions?.everyone) {
        message.reply('You cannot use a plugin, while pinging everyone.');
        return;
      }
    }
    
    const isDM = !message.guild;

    if (!(message instanceof CommandInteraction)) {

      const command = this.build(message.content)!;
      plugin = plugins[aliases[command.name]];

      // checks to see if the user is actually talking to the bot
      if (!command) {
        await this._tryFuzzySearch(message, command, isDM);
        return;
      }

      await this._attemptRunPlugin({
        type: 'message',
        plugin,
        command,
        message,
        isDM,
      });

    } else {
      const plugin = plugins[message.commandName];

      await this._attemptRunPlugin({
        type: 'interaction',
        plugin,
        message,
        isDM,
      });
    }
  }

  private async _tryFuzzySearch(message: types.IMessage, command: types.ICommand, isDM: boolean) {
    const { plugins, aliases } = this.container.pluginService;
    const allNames = Array.from(Object.keys(this.container.pluginService.aliases));

    const currentChannelName = (message.channel as TextChannel).name.toLowerCase();
    const validCommandsInChannel = allNames.filter((name) => {
      const plugin = plugins[aliases[name]];

      // Check channel type
      const permLevel = plugin.permission;
      if (permLevel !== this.container.channelService.getChannelType(currentChannelName)) {
        return false;
      }

      // If there is a specific channel, make sure it's this one
      const pluginChannel = plugin.pluginChannelName;
      if (!pluginChannel) {
        return true;
      }

      return pluginChannel.toLowerCase() === currentChannelName;
    });

    const [mostLikelyCommand] = validCommandsInChannel.sort(
      (a: string, b: string) => levenshtein(command.name, a) - levenshtein(command.name, b)
    );

    const embed = new MessageEmbed();
    embed.setTitle('Command not found');
    embed.setDescription(
      'Did you mean `!`' +
        `${mostLikelyCommand}${command.args.length ? ' ' : ''}${command.args.join(' ')}\`?`
    );

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react(this._CHECK_EMOTE);
    await msg.react(this._CANCEL_EMOTE);

    // Only run if its not the bot putting reacts
    const filter = (reaction: MessageReaction, user: User) =>
      [this._CHECK_EMOTE, this._CANCEL_EMOTE].includes(reaction.emoji.name!) &&
      user.id !== msg.author.id;

    const collector = msg.createReactionCollector(
      {
        filter,
        time: moment.duration(3, 'seconds').asMilliseconds(),
      } // Listen for 10 Minutes
    );

    // Delete message after collector is finished
    collector.on('end', () => {
      msg.delete();
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
      await this._attemptRunPlugin({
        type: 'message',
        message,
        plugin: mostLikelyPlugin,
        command,
        isDM,
      });
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



  private async _attemptRunPlugin(commandData: CommandResolvable) {

    const { isDM, plugin, message } = commandData;

    if ((isDM && !plugin.usableInDM) || (!isDM && !plugin.usableInGuild)) {
      return;
    }

    if (!isDM && !plugin.hasPermission(message)) {
      return;
    }

    if (commandData.type === 'message') {
      if (!plugin.validate(commandData.message, commandData.command.args)) {
        await message.reply(`Invalid arguments! Try: \`${Constants.Prefix}${plugin.usage}\``);
        return;
      }
    }

    let user;

    if (message instanceof CommandInteraction) {
      user = message.user.tag;
    } else {
      user = message.author.tag;
    }

    if (!plugin.isActive) {
      await message.reply('This plugin has been deactivated.');
      return;
    }

    const pEvent: types.IPluginEvent = {
      status: 'starting',
      pluginName: plugin.name,
      args: [],
      user,
    };

    try {
      this.container.loggerService.info(JSON.stringify(pEvent));

      // If it's a regular command, use the regular executor.
      if (commandData.type === 'message') {
        await plugin.execute(commandData.message, commandData.command.args);
      }

      // If it's a slash command, use the slash runner.

      // This should never happen.
      if (!types.isSlashCommand(plugin)) {
        throw new Error('Cannot invoke slash command on a non-slash-command plugin.');
      }

      await (plugin as unknown as ISlashPlugin).run(message as CommandInteraction);
      
      pEvent.status = 'fulfillCommand';
      this.container.loggerService.info(JSON.stringify(pEvent));
    } catch (e) {
      pEvent.status = 'error';
      pEvent.error = e;
      this.container.loggerService.error(JSON.stringify(pEvent));
    }
  }
}
