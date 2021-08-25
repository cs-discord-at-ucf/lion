import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export default class FetchClassChannelsPlugin extends Plugin {
  public commandName: string = 'fetchclasschans';
  public name: string = 'Fetches classes';
  public description: string = 'Fetches a list of current CS/IT classes';
  public usage: string = 'fetchclasschans';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const response = ['Current classes:\n'];
    response.push(...this.container.classService.buildClassListText(ClassType.ALL));
    for (const r of response) {
      await this.container.messageService.attemptDMUser(message, r);
    }
  }
}
