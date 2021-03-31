import { GuildChannel } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';
import Constants from '../../common/constants';

export class CheckClassesPlugin extends Plugin {
  public name: string = 'Check Class';
  public description: string = 'lists the classes someone is in';
  public usage: string = 'checkclasses <user>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;
  public commandPattern: RegExp = /[^#]+#\d{4}/;

  private _MAX_CHAR_LIMIT: number = 2000;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const targetUserName = args.join(' ');

    const member = this.container.guildService
      .get()
      .members.cache.filter((m) => m.user.tag === targetUserName)
      .first();
    if (!member) {
      message.reply('User not found.');
      return;
    }

    const classes = this.container.classService.getClasses(ClassType.ALL);
    const chansContainingUser = Array.from(classes.values()).filter((chan) =>
      Boolean(chan.permissionOverwrites.get(member.id)?.allow)
    );

    if (chansContainingUser.length === 0) {
      message.reply('User is not registered for any classes.');
      return;
    }

    if (chansContainingUser.length === Array.from(classes.keys()).length) {
      message.reply('User is registered for all classes.');
      return;
    }

    const chansForMessage: string[] = this._adaptToChanMessageString(chansContainingUser);
    chansForMessage.forEach((m) =>
      message.reply(`User is registered for \`${chansContainingUser.length}\` classes:\n\`${m}\``)
    );
  }

  private _adaptToChanMessageString(userChans: GuildChannel[]): string[] {
    const chanNames = userChans.map((c) => c.name);

    //If its not longer than the char limit, send it
    const toString = chanNames.join(' | ');
    if (toString.length < this._MAX_CHAR_LIMIT) {
      return [toString];
    }

    const middle = chanNames.length / 2; //Find the middle element
    const splitChans = [chanNames.slice(0, middle), chanNames.slice(middle)]; //Split the classes into 2 equal groups

    //For each group, join to string
    return splitChans.map((chans) => chans.join(' | '));
  }
}
