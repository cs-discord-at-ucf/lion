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
import { SlashCommandHandler } from '../app/handlers/slash_command.handler';

export class HandlerService {
  public messageHandlers = [
    BlacklistHandler,
    CommandHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    CountingHandler,
    LionPingHandler,
    SlashCommandHandler,
  ];

  public messageUpdateHandlers = [
    BlacklistHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
    ReactHandler,
    CountingHandler,
  ];

  public privateMessageHandlers = [CommandHandler];

  public channelHandlers = [ClassChannelHandler];

  public userUpdateHandlers = [UserUpdateHandler];

  public memberAddHandlers = [NewMemberRoleHandler, WelcomeHandler, MemberCountHandler];

  public reactionHandlers = [ReactHandler];
}
