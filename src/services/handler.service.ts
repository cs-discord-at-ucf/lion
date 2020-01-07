import { BlacklistHandler } from '../app/handlers/blacklist.handler';
import { ClassChannelHandler } from '../app/handlers/class_channel.handler';
import { CommandHandler } from '../app/handlers/command.handler';
import { RequireUrlHandler } from '../app/handlers/require_url.handler';
import { TagRateLimitHandler } from '../app/handlers/tag_rate_limit.handler';

export class HandlerService {
  public messageHandlers = [
    BlacklistHandler,
    CommandHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
  ];

  public channelHandlers = [ClassChannelHandler];
}
