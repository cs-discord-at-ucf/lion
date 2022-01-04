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
import { IContainer } from '../common/types';
import { Handler } from '../common/handler';
import { PointReactHandler } from '../app/handlers/point_react.handler';
import { PointMessageHandler } from '../app/handlers/point_message.handler';

export class HandlerService {
  public privateMessageHandlersTypes = [CommandHandler];
  public channelHandlersTypes = [ClassChannelHandler];
  public userUpdateHandlersTypes = [UserUpdateHandler];
  public memberRemoveHandlersTypes = [PersistRolesHandler];
  public reactionHandlersTypes = [ReactHandler, PointReactHandler];
  public threadCreateHandlersTypes = [ThreadCreateLogHandler];
  public messageDeleteHandlersTypes = [PingDeleteHandler];
  public messageHandlersTypes = [
    CommandHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    CountingHandler,
    LionPingHandler,
    EveryoneHandler,
    ModCommandsDiscussionHandler,
    PointMessageHandler,
    BlacklistHandler,
  ];
  public messageUpdateHandlersTypes = [
    RequireUrlHandler,
    TagRateLimitHandler,
    ReactHandler,
    CountingHandler,
    EveryoneHandler,
    BlacklistHandler,
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

  public initHandlerStates(container: IContainer): Promise<void> {
    return container.controllerService.initRunnableStates(container, this._getAllHandlers().flat());
  }

  public setHandlerState(container: IContainer, name: string, state: boolean): Promise<void> {
    // There are duplicate handlers for messageUpdate and messageEdit, so we need to change the state on both
    const allHandlers = this._getAllHandlers();
    const handlers = allHandlers.reduce((acc: Handler[], handlerList: Handler[]) => {
      const found = handlerList.filter(
        (handler) => handler.name.toLowerCase() === name.toLowerCase()
      );

      return acc.concat(found);
    }, []);

    if (!handlers.length) {
      throw new Error(`Could not find handler named \'${name}\'`);
    }

    return container.controllerService.setRunnableState(container, handlers, state);
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

  public getAllHandlers(): Handler[] {
    return this._getAllHandlers().flat();
  }
}
