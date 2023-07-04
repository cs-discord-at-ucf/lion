import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup } from '../../common/types';
import { ActivityType } from 'discord.js';

export default class LionPresence extends Plugin {
  public commandName: string = 'setactivity';
  public name: string = 'Lion Presence';
  public description: string = 'Plugin to set the presence of the lion bot.';
  public usage: string = 'setactivity <activity_type> <message>';
  public override pluginAlias = ['setact'];
  public permission: ChannelGroup = ChannelGroup.Staff;
  private _types: string[] = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];
  private _typeMappings: Map<
    string,
    | ActivityType.Playing
    | ActivityType.Streaming
    | ActivityType.Listening
    | ActivityType.Watching
    | ActivityType.Competing
  > = new Map([
    ['PLAYING', ActivityType.Playing],
    ['STREAMING', ActivityType.Streaming],
    ['LISTENING', ActivityType.Listening],
    ['WATCHING', ActivityType.Watching],
    ['COMPETING', ActivityType.Competing],
  ]);

  constructor(public container: IContainer) {
    super();
    this._typeMappings.set('fuck', ActivityType.Playing);
  }

  public override validate(message: IMessage, args: string[]) {
    return args && args.length > 1;
  }

  public async execute(message: IMessage, args: string[]) {
    const [type, ...activity] = args;

    if (!this._types.includes(type.toUpperCase())) {
      await message.reply('Not a valid activity type.');
      return;
    }

    this.container.clientService.user?.setPresence({
      activities: [
        {
          name: activity.join(' '),
          type: this._typeMappings.get(type.toUpperCase()),
        },
      ],
      status: 'online',
    });

    await message.reply('Activity set!');
  }
}
