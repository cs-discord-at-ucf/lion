import { BlacklistHandler } from '../app/handlers/blacklist.handler';
import { ClassChannelHandler } from '../app/handlers/class_channel.handler';
import { CommandHandler } from '../app/handlers/command.handler';
import { RequireUrlHandler } from '../app/handlers/require_url.handler';
import { TagRateLimitHandler } from '../app/handlers/tag_rate_limit.handler';
import { ReactHandler } from '../app/handlers/react.handler';
import { UserUpdateHandler } from '../app/handlers/user_update.handler';
import { NewMemberRoleHandler } from '../app/handlers/new_member_role.handler';
import { WelcomeHandler } from '../app/handlers/welcome.handler';
import { CountingHandler } from '../app/handlers/counting.handler';
import { LionPingHandler } from '../app/handlers/lionping.handler';
import { MemberCountHandler } from '../app/handlers/membercount.handler';
import { EveryoneHandler } from '../app/handlers/everyone.handler';
import { PersistRolesHandler } from '../app/handlers/persist_roles.handler';
import { RejoinRoleHandler } from '../app/handlers/rejoin_role.handler';
import { ModCommandsDiscussionHandler } from '../app/handlers/mod_commands_discussion.handler';
import { ThreadCreateLogHandler } from '../app/handlers/thread_create_log.handler';
import { PingDeleteHandler } from '../app/handlers/ping_delete.handler';
import { IContainer, Maybe } from '../common/types';
import { HandlerStateModel } from '../schemas/state.schema';
import mongoose from 'mongoose';
import { Handler } from '../common/handler';

export class HandlerService {
  public privateMessageHandlersTypes = [CommandHandler];
  public channelHandlersTypes = [ClassChannelHandler];
  public userUpdateHandlersTypes = [UserUpdateHandler];
  public memberRemoveHandlersTypes = [PersistRolesHandler];
  public reactionHandlersTypes = [ReactHandler];
  public threadCreateHandlersTypes = [ThreadCreateLogHandler];
  public messageDeleteHandlersTypes = [PingDeleteHandler];
  public messageHandlersTypes = [
    BlacklistHandler,
    CommandHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    CountingHandler,
    LionPingHandler,
    EveryoneHandler,
    ModCommandsDiscussionHandler,
  ];
  public messageUpdateHandlersTypes = [
    BlacklistHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    ReactHandler,
    CountingHandler,
    EveryoneHandler,
  ];
  public memberAddHandlersTypes = [
    NewMemberRoleHandler,
    WelcomeHandler,
    MemberCountHandler,
    RejoinRoleHandler,
  ];

  public privateMessageHandlers: Handler[] = [];
  public channelHandlers: Handler[] = [];
  public userUpdateHandlers: Handler[] = [];
  public memberRemoveHandlers: Handler[] = [];
  public reactionHandlers: Handler[] = [];
  public threadCreateHandlers: Handler[] = [];
  public messageDeleteHandlers: Handler[] = [];
  public messageHandlers: Handler[] = [];
  public messageUpdateHandlers: Handler[] = [];
  public memberAddHandlers: Handler[] = [];

  public async initHandlerStates(container: IContainer) {
    if (
      !process.env.MONGO_DB_NAME ||
      !process.env.MONGO_URL ||
      !process.env.MONGO_USER_NAME ||
      !process.env.MONGO_USER_PASS
    ) {
      return;
    }

    if (!mongoose.connection.readyState) {
      await container.storageService.connectToDB();
    }

    const fetchedStates = await HandlerStateModel.find({
      guildID: container.guildService.get().id,
    });

    // Set all of the handlers to the persisted state.
    const allHandlers = this._getAllHandlers();
    allHandlers.forEach((handlerList) => {
      handlerList.forEach((handler) => {
        fetchedStates.forEach((state) => {
          if (state.name === handler.name) {
            handler.setActive(state.isActive);
          }
        });
      });
    });
  }

  public async setHandlerState(container: IContainer, name: string, state: boolean) {
    const allHandlers = this._getAllHandlers();
    const handler = allHandlers.reduce((acc: Maybe<Handler>, handlerList: Handler[]) => {
      const found = handlerList
        .filter((handler) => handler.name.toLowerCase() === name.toLowerCase())
        .pop();

      // If we haven't found it yet
      if (!acc) {
        return found;
      }

      return acc;
    }, null);

    if (!handler) {
      throw new Error(`Could not find plugin named \'${name}\'`);
    }

    if (handler.isActive() === state) {
      throw new Error(`This plugin is already ${state ? 'activated' : 'deactivated'}`);
    }

    handler.setActive(state);

    // Save data in persistently.
    if (!mongoose.connection.readyState) {
      throw new Error('Error connecting to the DB');
    }

    try {
      await HandlerStateModel.updateOne(
        { name: handler.name, guildID: container.guildService.get().id },
        { $set: { isActive: state } },
        { upsert: true }
      );
    } catch (error) {
      console.log(error);
    }
  }

  public pushHandler(handler: Handler, handlerCategory: Handler[]) {
    handlerCategory.push(handler);
  }

  // The reason for not flatteninng this is because .flat duplicates the values
  // Instead of referencing the original object
  // Which means that when you set the state, its doesnt affect the **actual** Handler
  // I literally spent 3+ hours on that specific bug
  private _getAllHandlers(): Handler[][] {
    return [
      this.privateMessageHandlers,
      this.channelHandlers,
      this.userUpdateHandlers,
      this.memberRemoveHandlers,
      this.reactionHandlers,
      this.threadCreateHandlers,
      this.messageDeleteHandlers,
      this.messageHandlers,
      this.messageUpdateHandlers,
      this.memberAddHandlers,
    ];
  }

  public initializeHandlers(container: IContainer): void {
    this.messageHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.messageHandlers);
    });

    this.messageUpdateHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.messageUpdateHandlers);
    });

    this.privateMessageHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.privateMessageHandlers);
    });

    this.channelHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.channelHandlers);
    });

    this.userUpdateHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.userUpdateHandlers);
    });

    this.memberAddHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.memberAddHandlers);
    });

    this.memberRemoveHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.memberRemoveHandlers);
    });

    this.reactionHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.reactionHandlers);
    });

    this.threadCreateHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.threadCreateHandlers);
    });

    this.messageDeleteHandlersTypes.forEach((Handler) => {
      this.pushHandler(new Handler(container), this.messageDeleteHandlers);
    });
  }
}
