import { BlacklistHandler } from '../app/handlers/blacklist.handler';
import { RequireUrlHandler } from '../app/handlers/require_url.handler';
import { CommandHandler } from '../app/handlers/command.handler';
import { TagRateLimitHandler } from '../app/handlers/tag_rate_limit.handler';
import { DMHandler } from '../app/handlers/dm.handler';

export class HandlerService {
  public handlers = [
    BlacklistHandler,
    CommandHandler,
    DMHandler,
    RequireUrlHandler,
    TagRateLimitHandler,
  ];
}
