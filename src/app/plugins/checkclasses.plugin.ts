import { GuildChannel } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class CheckClassesPlugin extends Plugin {
  public name: string = 'Check Class';
  public description: string = 'lists the classes someone is in';
  public usage: string = 'checkclass <user>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;

  //   private _allClassChannels: GuildChannel[] = [];

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
    const chansContainingUser = allClassChannels.filter((chan) =>
      chan.permissionOverwrites.get(member.id)
    );

    if (chansContainingUser.length === 0) {
      message.reply('User is not registered for any classes.');
      return;
    }

    if (chansContainingUser.length === allClassChannels.length) {
      message.reply('User is registered for all classes.');
      return;
    }

    message.reply(
      `User is registered for:\n\`${chansContainingUser.map((c) => c.name).join(' | ')}\``
    );
  }
  private _getAllClassChannels(): GuildChannel[] {
    const guildChans = this.container.guildService.get().channels;

    const classChans = guildChans
      .filter((chan) => this.container.classService.isClassChannel(chan.name))
      .array();

    return classChans;
  }
}
