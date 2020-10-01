import { GuildChannel, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';

export class SlowModePlugin extends Plugin {
  public name: string = 'SlowMode Plugin';
  public description: string = "Restricts a user's access to specified channels";
  public usage: string = 'slowmode <seconds to keep slowmode on> <slowmode setting> <channels...>';
  public pluginAlias = ['slow'];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.ModChat;

  private _commandPattern: RegExp = /(\d+)\s+(\d+)\s+((?:<#(?:\d+)>\s*)+)/;
  private _channelIDRegex: RegExp = /<#(\d+)>/g;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args?: string[]) {
    return !!args && this._commandPattern.test(args.join(' '));
  }

  public async execute(message: IMessage, args: string[]) {
    const match = args.join(' ').match(this._commandPattern);

    // never happens, but make linter happy
    if (!match) {
      return;
    }

    const [_, expiration, slowmodeSetting, channels] = match;

    const channel_objs =
      channels
        .match(this._channelIDRegex)
        ?.map((c) => this.container.guildService.get().channels.get(c.replace(/\D/g, '')))
        .filter((c) => c !== undefined) || [];

    const createUndoFunc = (channel: TextChannel) => {
      const f = async () => {
        this.container.loggerService.info(`turning off slowmode in ${channel.name}`);
        await channel.setRateLimitPerUser(0);
      };
      return f;
    };

    const expDate = new Date();
    expDate.setSeconds(expDate.getSeconds() + +expiration);

    for (const channel of channel_objs as GuildChannel[]) {
      const c = channel as TextChannel;

      this.container.loggerService.info(`turning on slowmode in ${channel.name}`);

      c.send(`**ANNOUNCEMENT**\nSlowmode is on until ${expDate.toISOString()}`);

      await c.setRateLimitPerUser(+slowmodeSetting, `slowmode command by ${message.author.tag}`);
      setTimeout(createUndoFunc(c), 1000 * +expiration);
    }
  }
}
