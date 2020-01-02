import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export class FetchClassChannelsPlugin extends Plugin {
  public name: string = 'Fetches classes';
  public description: string = 'Fetches a list of current CS/IT classes';
  public usage: string = '';
  public permission: ChannelType = ChannelType.Admin;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const itChannels = this.container.classService.getClasses(ClassType.IT);
    const csChannels = this.container.classService.getClasses(ClassType.CS);

    let response = 'Current classes:\n';
    response += '```\n';
    response += 'CS classes:\n';
    csChannels.forEach((channel) => {
      response += channel.name + '\n';
    });

    response += '\nIT classes:\n';
    itChannels.forEach((channel) => {
      response += channel.name + '\n';
    });

    response += '```';
    message.reply(response);
  }
}
