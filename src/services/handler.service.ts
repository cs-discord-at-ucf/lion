import { BlacklistHandler } from '../app/handlers/blacklist.handler';
import { CommandHandler } from '../app/handlers/command.handler';

export class HandlerService {
  public handlers = [BlacklistHandler, CommandHandler];
}
