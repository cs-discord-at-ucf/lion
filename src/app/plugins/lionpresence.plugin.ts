import { ActivityType } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class LionPresence extends Plugin {
  public commandName: string = 'lionpresence';
  public name: string = 'Lion Presence';
  public description: string = 'Plugin to set the presence of the lion bot.';
  public usage: string = 'activity <activity_type> <message>';
  public pluginAlias = ['setactivity', 'setact'];
  public permission: ChannelType = ChannelType.Staff;
  private _types: string[] = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length > 1;
  }

  public async execute(message: IMessage, args: string[]) {
    const [type, ...activity] = args;

    if (!this._types.includes(type.toUpperCase())) {
      await message.reply('Not a valid activity type.');
      return;
    }

    this.container.clientService.user?.setPresence({
      activities: [{ name: activity.join(' '), type: type.toUpperCase() as ActivityType }],
      status: 'online',
    });

    await message.reply('Activity set!');
  }
}
