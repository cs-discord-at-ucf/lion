import { Bot } from './app/bot';
import { IBot } from './common/types';

class Lion {
  private _bot: IBot;
  constructor() {
    this._bot = new Bot();
    this._bot.run();
  }
}

new Lion();
