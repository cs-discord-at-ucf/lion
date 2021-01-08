import { GuildChannel } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';
import Constants from '../../common/constants';

export class CheckClassesPlugin extends Plugin {
  public name: string = 'Check Class';
  public description: string = 'lists the classes someone is in';
  public usage: string = 'checkclass <user>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;

  private _MAX_CHAR_LIMIT: number = 2000;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length >= 1;
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

    const classes = this.container.classService.getClasses(ClassType.ALL);
    const chansContainingUser = [];

    for (const classObj of classes) {
      const [, chan] = classObj;
      if (chan.permissionOverwrites.get(member.id)?.allow) {
        chansContainingUser.push(chan);
      }
    }

    if (chansContainingUser.length === 0) {
      message.reply('User is not registered for any classes.');
      return;
    }

    if (chansContainingUser.length === classes.keys.length) {
      message.reply('User is registered for all classes.');
      return;
    }

    const chansForMessage: string[] = this._convertChansToString(chansContainingUser);
    chansForMessage.forEach((m) =>
      message.reply(`User is registered for \`${chansContainingUser.length}\` classes:\n\`${m}\``)
    );
  }

  private _convertChansToString(userChans: GuildChannel[]): string[] {
    //If its not longer than the char limit, send it
    const toString = userChans.map((c) => c.name).join(' | ');
    if (toString.length < this._MAX_CHAR_LIMIT) {
      return [toString];
    }

    const middle = userChans.length / 2; //Find the middle element
    const splitChans = [userChans.slice(0, middle), userChans.slice(middle)]; //Split the classes into 2 equal groups

    //For each group, resolve them to their names and join to string
    return splitChans.map((halve) => halve.map((chan) => chan.name).join(' | '));
  }
}
