import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class BubbleWrapPlugin extends Plugin {
  public commandName: string = 'bubblewrap';
  public name: string = 'Bubble Wrap';
  public description: string = 'Sends the user a sheet of bubble wrap to pop';
  public usage: string = 'bubblewrap';
  public pluginAlias = ['bw'];
  public permission: ChannelType = ChannelType.Public;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const wrap: string = 'Here is some bubblewrap\n' + '||pop||||pop||||pop||||pop||||pop||\n'.repeat(5);
    await message.channel.send(wrap);
  }
}
