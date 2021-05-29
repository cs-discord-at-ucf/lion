import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class LionPresence extends Plugin {
  public name: string = 'Lion Presence';
  public description: string = 'Plugin to set the presence of the lion bot.';
  public usage: string = 'setActivity <status>';
  public pluginAlias = ['setActivity', 'setAct'];
  public permission: ChannelType = ChannelType.Staff;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length === 1;
  }

  public async execute(message: IMessage, args: string[]) {
    console.log('We executing!');
    await this.container.clientService.user
      ?.setPresence({ activity: { name: args[1], type: 'CUSTOM_STATUS' }, status: 'idle' })
      .catch((err) => this.container.loggerService.warn(err));
  }
}
