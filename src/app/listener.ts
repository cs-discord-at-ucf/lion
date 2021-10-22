import {
  GuildMember,
  Message,
  MessageEmbed,
  PartialGuildMember,
  PartialMessage,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import Constants from '../common/constants';
import { IContainer, IHandler, IMessage, Mode } from '../common/types';
import { Handler } from '../common/handler';

export class Listener {
  constructor(public container: IContainer) {
    this._initializeHandlers();

    this.container.clientService.on('channelCreate', async () => {
      await this._executeHandlers(this.container.handlerService.channelHandlers);
    });
    this.container.clientService.on('channelDelete', async () => {
      await this._executeHandlers(this.container.handlerService.channelHandlers);
    });
    this.container.clientService.on('channelUpdate', async () => {
      await this._executeHandlers(this.container.handlerService.channelHandlers);
    });
    this.container.clientService.on('messageReactionAdd', async (reaction, user) => {
      await this._executeHandlers(this.container.handlerService.reactionHandlers, reaction, user);
    });

    this.container.clientService.on('ready', async () => {
      this.container.loggerService.info(`Loaded ${this.container.jobService.size()} jobs...`);

      // Load in plugin states.
      await this.container.pluginService.initPluginStates(this.container);
      await this.container.jobService.initJobStates(this.container);
      await this.container.handlerService.initHandlerStates(this.container);

      this.container.loggerService.info('Lion is now running!');

      // Don't need to send this when testing
      // This is useful for knowing when the bot crashed in production and restarts
      if (!process.env.NODE_ENV || process.env.NODE_ENV === Mode.Development) {
        return;
      }

      const notificationChannel = this.container.guildService.getChannel(
        Constants.Channels.Public.LionProjectGithub
      ) as TextChannel;

      const embed = new MessageEmbed();
      embed
        .setThumbnail(Constants.LionPFP)
        .setTitle('Lion is now running')
        .setColor('#ffca06')
        .setTimestamp(new Date());

      notificationChannel.send({ embeds: [embed] });
    });

    this.container.clientService.on('messageCreate', async (message: IMessage) => {
      await this._handleMessageOrMessageUpdate(message, false);
    });

    this.container.clientService.on(
      'messageUpdate',
      async (_old: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        await this._handleMessageOrMessageUpdate(newMessage as Message, true);
      }
    );

    this.container.clientService.on('messageDelete', async (message: Message | PartialMessage) => {
      await this._executeHandlers(this.container.handlerService.messageDeleteHandlers, message);
    });

    this.container.clientService.on(
      'guildMemberUpdate',
      async (
        oldUser: GuildMember | PartialGuildMember,
        newUser: GuildMember | PartialGuildMember
      ) => {
        await this._executeHandlers(
          this.container.handlerService.userUpdateHandlers,
          oldUser,
          newUser
        );
      }
    );

    this.container.clientService.on('guildMemberAdd', async (member: GuildMember) => {
      await this._executeHandlers(this.container.handlerService.memberAddHandlers, member);
    });

    this.container.clientService.on(
      'guildMemberRemove',
      async (member: GuildMember | PartialGuildMember) => {
        await this._executeHandlers(
          this.container.handlerService.memberRemoveHandlers,
          member as GuildMember
        );
      }
    );

    this.container.clientService.on('threadCreate', async (thread: ThreadChannel) => {
      await this._executeHandlers(this.container.handlerService.threadCreateHandlers, thread);
    });
  }

  private async _handleMessageOrMessageUpdate(message: IMessage, isMessageUpdate: boolean) {
    if (message.author.id === this.container.clientService.user?.id) {
      return;
    }

    if (message.webhookId) {
      return;
    }

    // If the message has a guild, use regular message handlers
    // Otherwise, it's a DM to handle differently.
    if (message.guild) {
      await this._tryEnsureMessageMember(message);

      if (isMessageUpdate) {
        await this._executeHandlers(this.container.handlerService.messageUpdateHandlers, message);
      } else {
        await this._executeHandlers(this.container.handlerService.messageHandlers, message);
      }
    } else {
      await this._executeHandlers(this.container.handlerService.privateMessageHandlers, message);
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
    this.container.handlerService.messageHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.messageHandlers
      );
    });

    this.container.handlerService.messageUpdateHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.messageUpdateHandlers
      );
    });

    this.container.handlerService.privateMessageHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.privateMessageHandlers
      );
    });

    this.container.handlerService.channelHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.channelHandlers
      );
    });

    this.container.handlerService.userUpdateHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.userUpdateHandlers
      );
    });

    this.container.handlerService.memberAddHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.memberAddHandlers
      );
    });

    this.container.handlerService.memberRemoveHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.memberRemoveHandlers
      );
    });

    this.container.handlerService.reactionHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.reactionHandlers
      );
    });

    this.container.handlerService.threadCreateHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.threadCreateHandlers
      );
    });

    this.container.handlerService.messageDeleteHandlersTypes.forEach((Handler) => {
      this.container.handlerService.pushHandler(
        new Handler(this.container),
        this.container.handlerService.messageDeleteHandlers
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _executeHandlers(handlers: Handler[], ...args: any[]) {
    await Promise.all(
      handlers
        .filter((h) => h.isActive())
        .map(async (handler: IHandler) => {
          try {
            await handler.execute(...args);
          } catch (e) {
            this.container.loggerService.error(e);
          }
        })
    );
  }
}
