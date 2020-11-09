import { BlacklistHandler } from '../app/handlers/blacklist.handler';
import { ClassChannelHandler } from '../app/handlers/class_channel.handler';
import { CommandHandler } from '../app/handlers/command.handler';
import { RequireUrlHandler } from '../app/handlers/require_url.handler';
import { TagRateLimitHandler } from '../app/handlers/tag_rate_limit.handler';
import { ReactHandler } from '../app/handlers/react.handler';
import { UserUpdateHandler } from '../app/handlers/user_update.handler';
import { NewMemberHandler } from '../app/handlers/new_member.handler';
import { AcknowledgeHandler } from '../app/handlers/acknowledge.handler';
export class HandlerService {
  public messageHandlers = [
    BlacklistHandler,
    CommandHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    ReactHandler,
  ];

  public privateMessageHandlers = [CommandHandler];

  public channelHandlers = [ClassChannelHandler];

  public userUpdateHandlers = [UserUpdateHandler];

  public memberAddHandlers = [NewMemberHandler];

  public reactionAddHandlers = [AcknowledgeHandler];
}
