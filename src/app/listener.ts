import { GuildMember, Interaction, Message, PartialGuildMember, PartialMessage } from 'discord.js';
import ISlashPlugin from '../common/slash';
import { IContainer, IHandler, IMessage, isSlashCommand } from '../common/types';
import Environment from '../environment';
import { CommandHandler } from './handlers/command.handler';

export class Listener {
  private _messageHandlers: IHandler[] = [];
  private _messageUpdateHandlers: IHandler[] = [];
  private _privateMessageHandlers: IHandler[] = [];
  private _channelHandlers: IHandler[] = [];
  private _userUpdateHandlers: IHandler[] = [];
  private _memberAddHandlers: IHandler[] = [];
  private _reactionHandlers: IHandler[] = [];

  constructor(public container: IContainer) {
    this._initializeHandlers();

    this.container.clientService.on('channelCreate', async () => {
      await this._executeHandlers(this._channelHandlers);
    });
    this.container.clientService.on('channelDelete', async () => {
      await this._executeHandlers(this._channelHandlers);
    });
    this.container.clientService.on('channelUpdate', async () => {
      await this._executeHandlers(this._channelHandlers);
    });
    this.container.clientService.on('messageReactionAdd', async (reaction, user) => {
      await this._executeHandlers(this._reactionHandlers, reaction, user);
    });

    this.container.clientService.on('ready', async () => {
      this.container.loggerService.info(`Loaded ${this.container.jobService.size()} jobs...`);

      const commands = Object.entries(this.container.pluginService.plugins).filter((entry) => {
        const [, plugin] = entry;
        return isSlashCommand(plugin);
      }).map(entry => {
        const [name, plugin] = entry;
        const options = isSlashCommand(plugin) ? (plugin as unknown as ISlashPlugin).parameters : undefined;

        return {
          name: name,
          description: plugin.description.substring(0, 99),
          options,
        };
      });

      // We only want to use guild commands for development, because global app commands
      // can take over an hour to propogate.
      if (process.env.NODE_ENV === 'development') {

        if (!Environment.GuildID) {
          throw new Error('You need to set the GUILD_ID in your .env file!');
        }
        
        await this.container.clientService.guilds.cache.get(Environment.GuildID)?.commands.set(commands);
      } else {
        await this.container.clientService.application?.commands.set(commands);
      }
      
      // Load in plugin states.
      await this.container.pluginService.initPluginState(this.container);

      this.container.loggerService.info('Lion is now running!');
    });

    // Used to handle slash commands.
    this.container.clientService.on('interaction', async (interaction: Interaction) => {
      // If it's not a command, we don't care.
      if (!interaction.isCommand()) { return; }

      // We only need the slash command handler.
      this._messageHandlers.forEach(handler => {
        if (handler instanceof CommandHandler) {
          handler.execute(interaction);
        }
      });
    });

    this.container.clientService.on('message', async (message: IMessage) => {
      await this._handleMessageOrMessageUpdate(message, false);
    });

    this.container.clientService.on(
      'messageUpdate',
      async (_old: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        await this._handleMessageOrMessageUpdate(newMessage as Message, true);
      }
    );

    this.container.clientService.on(
      'guildMemberUpdate',
      async (
        oldUser: GuildMember | PartialGuildMember,
        newUser: GuildMember | PartialGuildMember
      ) => {
        await this._executeHandlers(this._userUpdateHandlers, oldUser, newUser);
      }
    );

    this.container.clientService.on('guildMemberAdd', async (member: GuildMember) => {
      await this._executeHandlers(this._memberAddHandlers, member);
    });
  }

  private async _handleCommand(interaction: Interaction) {
    if (interaction.user.bot) {
      return;
    }

    if (interaction.guild) {

    }
  }

  private async _handleMessageOrMessageUpdate(message: IMessage, isMessageUpdate: boolean) {
    if (message.author.id === this.container.clientService.user?.id) {
      return;
    }

    // If the message has a guild, use regular message handlers
    // Otherwise, it's a DM to handle differently.
    if (message.guild) {
      await this._tryEnsureMessageMember(message);

      if (isMessageUpdate) {
        await this._executeHandlers(this._messageUpdateHandlers, message);
      } else {
        await this._executeHandlers(this._messageHandlers, message);
      }
    } else {
      await this._executeHandlers(this._privateMessageHandlers, message);
    }
  }

  // / Tries to make sure that message.member != null
  // / However, message.member may be null if, for example,
  // / the user leaves the guild before we try to look them up.
  private async _tryEnsureMessageMember(message: IMessage) {
    if (message.member) {
      return;
    }

    try {
      this.container.loggerService.debug(
        `Attempting extra lookup of ${message.author.tag} to a GuildMember`
      );

      const member = await this.container.guildService.get().members.fetch(message.author.id);

      // Removed as message.member is now read only
      // message.member = member;

      if (!member) {
        this.container.loggerService.warn(
          `Could not resolve ${message.author.tag} to a GuildMember`
        );
      }
    } catch (e) {
      this.container.loggerService.error(
        `While attempting to look up ${message.author.tag} as a GuildMember.`,
        e
      );
    }
  }

  private _initializeHandlers(): void {
    this.container.handlerService.messageHandlers.forEach((Handler) => {
      this._messageHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.messageUpdateHandlers.forEach((Handler) => {
      this._messageUpdateHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.privateMessageHandlers.forEach((Handler) => {
      this._privateMessageHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.channelHandlers.forEach((Handler) => {
      this._channelHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.userUpdateHandlers.forEach((Handler) => {
      this._userUpdateHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.memberAddHandlers.forEach((Handler) => {
      this._memberAddHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.reactionHandlers.forEach((Handler) => {
      this._reactionHandlers.push(new Handler(this.container));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _executeHandlers(handlers: IHandler[], ...args: any[]) {
    handlers.forEach(async (handler: IHandler) => {
      try {
        await handler.execute(...args);
      } catch (e) {
        this.container.loggerService.error(e);
      }
    });
  }
}
