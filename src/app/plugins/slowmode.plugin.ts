import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';

export default class SlowModePlugin extends Plugin {
  public commandName: string = 'slowmode';
  public name: string = 'SlowMode Plugin';
  public description: string = "Restricts a user's access to specified channels";
  public usage: string = 'slowmode <seconds to keep slowmode on> <slowmode setting> <channels...>';
  public override pluginAlias = ['slow'];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;

  constructor(public container: IContainer) {
    super();
  }

  public override validate(_message: IMessage, args?: string[]) {
    return !!args && args.length >= 3;
  }

  public execute(message: IMessage, args: string[]) {
    const createUndoFunc = (channel: TextChannel) => {
      const f = async () => {
        this.container.loggerService.info(`turning off slowmode in ${channel.name}`);
        await channel.setRateLimitPerUser(0);
      };
      return f;
    };

    // always at least three arguments per validate(...)
    const [expiration, slowmodeSetting, ...channels] = args;

    const expDate = new Date();
    expDate.setSeconds(expDate.getSeconds() + +expiration);

    channels
      .reduce((acc: TextChannel[], cur: string) => {
        const id = cur.replace(/\D/g, '');
        const channel = this.container.guildService.get().channels.cache.get(id) as TextChannel;

        channel && acc.push(channel);

        return acc;
      }, [])
      .forEach(async (channel: TextChannel) => {
        this.container.loggerService.info(`turning on slowmode in ${channel.name}`);

        await channel.send(`**ANNOUNCEMENT**\nSlowmode is on until ${expDate.toISOString()}`);

        // turn on slow mode
        await channel.setRateLimitPerUser(
          +slowmodeSetting,
          `slowmode command by ${message.author.tag}`
        );

        // create delayed-call to undo slowmode.
        setTimeout(createUndoFunc(channel), 1000 * +expiration);
      });
  }
}
