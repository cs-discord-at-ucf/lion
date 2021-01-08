import { GuildChannel } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';

export class CheckClassesPlugin extends Plugin {
  public name: string = 'Check Class';
  public description: string = 'lists the classes someone is in';
  public usage: string = 'checkclass <user>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;

  private _MAX_CHAR_LIMIT: number = 2000;
  private _ALLOW_NUM: number = 3072; //ID for allowed permission overwrite

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length >= 1;
  }

  public async execute(message: IMessage, args: string[]) {
    const targetUserName = args.join(' ');

    const member = this.container.guildService
      .get()
      .members.filter((m) => m.user.tag === targetUserName)
      .first();
    if (!member) {
      message.reply('User not found.');
      return;
    }

    const allClassChannels = this._getAllClassChannels();
    const chansContainingUser = allClassChannels.filter(
      (chan) => chan.permissionOverwrites.get(member.id)?.allow === this._ALLOW_NUM
    );

    if (chansContainingUser.length === 0) {
      message.reply('User is not registered for any classes.');
      return;
    }

    if (chansContainingUser.length === allClassChannels.length) {
      message.reply('User is registered for all classes.');
      return;
    }

    const chansForMessage: string[] = this._convertChansToString(chansContainingUser);
    chansForMessage.forEach((m) =>
      message.reply(`User is registered for \`${chansContainingUser.length}\` classes:\n\`${m}\``)
    );
  }

  private _getAllClassChannels(): GuildChannel[] {
    const guildChans = this.container.guildService.get().channels;

    const classChans = guildChans
      .filter((chan) => this.container.classService.isClassChannel(chan.name))
      .array();

    return classChans;
  }

  private _convertChansToString(userChans: GuildChannel[]): string[] {
    const toString = userChans.map((c) => c.name).join(' | ');
    if (toString.length < this._MAX_CHAR_LIMIT) {
      return [toString];
    }

    const middle = userChans.length / 2;
    const splitChans = [userChans.slice(0, middle), userChans.slice(middle)];
    return splitChans.map((chans) => chans.map((chan) => chan.name).join(' | '));
  }
}
