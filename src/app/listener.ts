import {
  GuildMember,
  Message,
  MessageEmbed,
  PartialGuildMember,
  PartialMessage,
  TextChannel,
} from 'discord.js';
import Constants from '../common/constants';
import { IContainer, IHandler, IMessage, Mode } from '../common/types';
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

      // Load in plugin states.
      await this.container.pluginService.initPluginState(this.container);

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

      notificationChannel.send(embed);
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

  private async _handleMessageOrMessageUpdate(message: IMessage, isMessageUpdate: boolean) {
    if (message.author.id === this.container.clientService.user?.id) {
      return;
    }

    if (message.webhookID) {
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
    await Promise.all(handlers.map(async (handler: IHandler) => {
      try {
        await handler.execute(...args);
      } catch (e) {
        this.container.loggerService.error(e);
      }
    }));
  }
}
