import { BlacklistHandler } from '../app/handlers/blacklist.handler';
import { RequireUrlHandler } from '../app/handlers/require_url.handler';
import { CommandHandler } from '../app/handlers/command.handler';
import { TagRateLimitHandler } from '../app/handlers/tag_rate_limit.handler';

export class HandlerService {
  public handlers = [BlacklistHandler, CommandHandler, RequireUrlHandler, TagRateLimitHandler];
}
