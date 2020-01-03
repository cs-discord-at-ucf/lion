import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export class RegisterPlugin extends Plugin {
  public name: string = 'Register Plugin';
  public description: string = 'Allows for you to register classes.';
  public usage: string = 'register (all | category <class_type> | <class_name>...)';
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  public async execute(message: IMessage, args?: string[]) {
    // Do a singular request if args is null or this is a category request
    if (!args ||
        args.length === 2 &&
        (args[1] === ClassType.CS || args[1] === ClassType.IT)) {
      const request = this.container.classService.buildRequest( message.author, args);
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
    } else {
      for (let arg of args) {
        const request = this.container.classService.buildRequest(message.author, [ arg ]);
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
  }
}
