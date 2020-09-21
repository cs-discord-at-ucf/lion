import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

export class SlowModePlugin extends Plugin {
  public name: string = 'Slowmode Plugin';
  public description: string = 'add slowmode via command for TA\'s';
  public usage: string = '!slowmode <time>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  constructor(public container: IContainer) {
    super();
  }

  private _commandPattern: RegExp = /(add|list|warn|ban)\s+([^#]+#\d{4})\s*(.*)/;

  public async execute(message: IMessage, args: string[]) {
    const match_arr = args.join(' ').match(this._commandPattern);

    if (args[0] === '!slowmode') {
      message.reply('Slowmode!');
      return;
    }
  }
}
