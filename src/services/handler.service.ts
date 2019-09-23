import { BlacklistHandler } from '../app/handlers/blacklist.handler';
import { RequireUrlHandler } from '../app/handlers/require_url.handler';
import { CommandHandler } from '../app/handlers/command.handler';

export class HandlerService {
  public handlers = [BlacklistHandler, CommandHandler, RequireUrlHandler];
}
