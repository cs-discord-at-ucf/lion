import { GuildChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';

export class ChanBanPlugin extends Plugin {
  public name: string = 'ChanBan Plugin';
  public description: string = "Restricts a user's access to specified channels";
  public usage: string = 'chanban <user> <chans...>';
  public pluginAlias = ['channelban'];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;

  private _commandPattern: RegExp = /([^#]+#\d{4})\s*((?:<#(?:\d+)>\s*)+)/;
  private _channelIDRegex: RegExp = /<#(\d+)>/g;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args?: string[]) {
    return !!args && this._commandPattern.test(args.join(' '));
  }

  public async execute(message: IMessage, args?: string[]) {
    // never happens, but make linter happy
    if (!args) {
      return;
    }

    const match = args.join(' ').match(this._commandPattern);

    // never happens, but make linter happy
    if (!match) {
      return;
    }

    const [_, username, channels] = match;

    const channel_objs =
      channels
        .match(this._channelIDRegex)
        ?.map((c) => this.container.guildService.get().channels.get(c.replace(/\D/g, '')))
        .filter((c) => c !== undefined) || [];

    try {
      const successfully_banned_channels = await this.container.modService.channelBan(
        message.guild,
        username,
        channel_objs as GuildChannel[]
      );
      if (successfully_banned_channels.length) {
        message.reply(
          `Banned user from ${successfully_banned_channels.map((c) => c.name).join(', ')}`
        );
      } else {
        message.reply('Could not ban user in any channels');
      }
    } catch (ex) {
      this.container.loggerService.error(`When trying to ban ${username} from channels.`, ex);
    }
  }
}
