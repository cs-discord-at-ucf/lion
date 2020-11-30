import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';
import { GuildChannel, GuildMember, User } from 'discord.js';

export class ShadowBanPlugin extends Plugin {
  public name: string = 'Shadowban Plugin';
  public description: string = 'Disables a users ability to view public channels.';
  public usage: string = 'shadowban <ban|unban> <user>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length > 1;
  }

  public async execute(message: IMessage, args?: string[]) {
    if (!args) {
      return;
    }

    const [subCommand, ...targetUser] = args;
    const member = this.container.guildService
      .get()
      .members.filter((m) => m.user.tag === targetUser.join(' '))
      .first();

    if (!member) {
      message.reply('User not found.');
      return;
    }

    if (subCommand === 'ban') {
      this._banUser(message, member.user);
      return;
    } else if (subCommand === 'unban') {
      this._unbanUser(message, member.user);
      return;
    } else {
      message.reply('Invalid subcommand\nTry: `!shadowban <ban|unban> <user>`');
    }
  }

  private _banUser(message: IMessage, user: User) {
    this._getChannelsToBan().forEach((chan) => {
      chan.overwritePermissions(user, {
        VIEW_CHANNEL: false,
      });
    });

    message.reply(`${user.tag} has been shadowbanned`);
  }

  private _unbanUser(message: IMessage, user: User) {
    this._getChannelsToBan().forEach((chan) => {
      chan.permissionOverwrites.get(user.id)?.delete();
    });

    message.reply(`${user.tag} has been unshadowbanned`);
  }

  private _getChannelsToBan(): GuildChannel[] {
    const chans: GuildChannel[] = [];
    this.container.guildService.get().channels.forEach((chan) => {
      if (
        this.container.channelService.getChannelType(chan.name) === ChannelType.Admin ||
        this.container.channelService.getChannelType(chan.name) === ChannelType.Staff ||
        this.container.channelService.getChannelType(chan.name) === ChannelType.Bot ||
        this.container.classService.isClassChannel(chan.name) ||
        chan.name === Constants.Channels.Public.CodeOfConduct
      ) {
        return;
      }

      chans.push(chan);
    });
    return chans;
  }
}
