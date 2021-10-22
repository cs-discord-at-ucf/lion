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
import { HandlerStateModel } from '../schemas/state.schema';
import mongoose from 'mongoose';
import { Handler } from '../common/handler';

export class HandlerService {
  public privateMessageHandlers = [CommandHandler];
  public channelHandlers = [ClassChannelHandler];
  public userUpdateHandlers = [UserUpdateHandler];
  public memberRemoveHandlers = [PersistRolesHandler];
  public reactionHandlers = [ReactHandler];
  public threadCreateHandlers = [ThreadCreateLogHandler];
  public messageDeleteHandlers = [PingDeleteHandler];
  public messageHandlers = [
    BlacklistHandler,
    CommandHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    CountingHandler,
    LionPingHandler,
    EveryoneHandler,
    ModCommandsDiscussionHandler,
  ];
  public messageUpdateHandlers = [
    BlacklistHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    ReactHandler,
    CountingHandler,
    EveryoneHandler,
  ];
  public memberAddHandlers = [
    NewMemberRoleHandler,
    WelcomeHandler,
    MemberCountHandler,
    RejoinRoleHandler,
  ];

  private _allHandlers: Handler[] = [];

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
    this._allHandlers.forEach((handler) => {
      fetchedStates.forEach((state) => {
        if (state.name === handler.name) {
          handler.setActive(state.isActive);
        }
      });
    });
  }

  public async setHandlerState(container: IContainer, name: string, state: boolean) {
    const handler = this._allHandlers
      .filter((h) => h.name.toLowerCase() === name.toLowerCase())
      .pop();
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

  public pushHandler(handler: Handler) {
    this._allHandlers.push(handler);
  }
}
