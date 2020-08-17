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
    let response = 'Current classes:\n```';
    response += this.container.classService.buildClassListText(ClassType.ALL);
    response += '```';
    message.reply(response);
  }
}
