import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class RegisterPlugin extends Plugin {
  public name: string = 'Register Plugin';
  public description: string = 'Allows for you to register classes.';
  public usage: string = 'register <class_name>';
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
      const response = await this.container.classService.register(request);
      message.reply(response);
    } catch (e) {
      message.reply(e);
    }
  }
}
