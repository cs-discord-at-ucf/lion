import { GuildMember } from 'discord.js';
import { IContainer, IHandler, IMessage } from '../common/types';

export class Listener {
  private _messageHandlers: IHandler[] = [];
  private _privateMessageHandlers: IHandler[] = [];
  private _channelHandlers: IHandler[] = [];
  private _userUpdateHandlers: IHandler[] = [];
  private _autoUnverifyHandlers: IHandler[] = [];

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

    this.container.clientService.on('ready', () => {
      this.container.loggerService.info(`Loaded ${this.container.jobService.size()} jobs...`);
      this.container.loggerService.info('Lion is now running!');
    });

    this.container.clientService.on('message', async (message: IMessage) => {
      if (message.author.bot) {
        return;
      }

      // If the message has a guild, use regular message handlers
      // Otherwise, it's a DM to handle differently.
      if (message.guild) {
        await this._tryEnsureMessageMember(message);
        await this._executeHandlers(this._messageHandlers, message);
      } else {
        await this._executeHandlers(this._privateMessageHandlers, message);
      }
    });

    this.container.clientService.on(
      'guildMemberUpdate',
      async (oldUser: GuildMember, newUser: GuildMember) => {
        await this._executeHandlers(this._userUpdateHandlers, oldUser, newUser);
      }
    );

    this.container.clientService.on('guildMemberAdd', async (member: IMessage) => {
      await this._executeHandlers(this._autoUnverifyHandlers, member);
    });
  }

  /// Tries to make sure that message.member != null
  /// However, message.member may be null if, for example,
  /// the user leaves the guild before we try to look them up.
  private async _tryEnsureMessageMember(message: IMessage) {
    if (message.member) {
      return;
    }

    try {
      this.container.loggerService.debug(
        `Attempting extra lookup of ${message.author.tag} to a GuildMember`
      );

      const member = await this.container.guildService.get().fetchMember(message.author.id);
      message.member = member;

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

    this.container.handlerService.privateMessageHandlers.forEach((Handler) => {
      this._privateMessageHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.channelHandlers.forEach((Handler) => {
      this._channelHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.userUpdateHandlers.forEach((Handler) => {
      this._userUpdateHandlers.push(new Handler(this.container));
    });

    // this.container.handlerService.autoUnverifyHandlers.forEach((Handler) => {
    //   this._autoUnverifyHandlers.push(new Handler(this.container));
    // });
  }

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
