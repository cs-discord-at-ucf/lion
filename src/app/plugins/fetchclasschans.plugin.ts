import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export class FetchClassChannelsPlugin extends Plugin {
  public name: string = 'Fetches classes';
  public description: string = 'Fetches a list of current CS/IT classes';
  public usage: string = '';
  public pluginCommands = [];
  public permission: ChannelType = ChannelType.Admin;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const response = ['Current classes:\n'];
    response.push(...this.container.classService.buildClassListText(ClassType.ALL));
    let shouldSendInMain = false;
    for (const r of response) {
      try {
        await message.author.send(r);
      } catch (e) {
        shouldSendInMain = true;
        break;
      }
    }

    if (shouldSendInMain) {
      for (const r of response) {
        try {
          await message.reply(r);
        } catch (e) { }
      }
    }
  }
}
