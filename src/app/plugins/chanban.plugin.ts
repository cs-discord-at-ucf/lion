import { GuildChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';

export default class ChanBanPlugin extends Plugin {
  public commandName: string = 'chanban';
  public name: string = 'ChanBan Plugin';
  public description: string = "Restricts a user's access to specified channels";
  public usage: string = 'chanban <user> <chans...>';
  public pluginAlias = ['channelban'];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;
  public commandPattern: RegExp = /([^#]+#\d{4})\s*((?:<#(?:\d+)>\s*)+)/;

  private _channelIDRegex: RegExp = /<#(\d+)>/g;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    // never happens, but make linter happy
    if (!args) {
      return;
    }

    const match = args.join(' ').match(this.commandPattern);

    // never happens, but make linter happy
    if (!match) {
      return;
    }

    const [, username, channels] = match;

    const channel_objs =
      channels
        .match(this._channelIDRegex)
        ?.map((c) => this.container.guildService.get().channels.cache.get(c.replace(/\D/g, '') as `${bigint}`))
        .filter((c) => c !== undefined) ?? [];

    try {
      const successfully_banned_channels = await this.container.modService.channelBan(
        this.container.guildService.get(),
        username,
        channel_objs as GuildChannel[]
      );
      if (successfully_banned_channels.length) {
        await message.reply(
          `Banned user from ${successfully_banned_channels.map((c) => c.name).join(', ')}`
        );
      } else {
        await message.reply('Could not ban user in any channels');
      }
    } catch (ex) {
      this.container.loggerService.error(`When trying to ban ${username} from channels.`, ex);
    }
  }
}
