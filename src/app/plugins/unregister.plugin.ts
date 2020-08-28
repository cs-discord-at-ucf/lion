import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class UnregisterPlugin extends Plugin {
  public name: string = 'Unregister Plugin';
  public description: string = 'Allows for you to unregister classes.';
  public usage: string = 'unregister <class_name>';
  public pluginCommands = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  public async execute(message: IMessage, args?: string[]) {
    const request = this.container.classService.buildRequest(message.author, args);
    if (!request) {
      message.reply('I was unable to build your request.');
      return;
    }
    try {
      const response = await this.container.classService.unregister(request);
      message.reply(response);
    } catch (e) {
      message.reply(e);
    }
  }
}
