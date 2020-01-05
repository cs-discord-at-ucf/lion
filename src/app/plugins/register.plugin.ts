import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType, ClassResponseType } from '../../common/types';

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
        const responseType: ClassResponseType = await this.container.classService.register(request);
        if (responseType === ClassResponseType.Success) {
          message.reply(`You have successfully been added to the ${request.categoryType} category.`);
        } else {
          message.reply(`An error occured while attempting to add you to the ${request.categoryType} category.`);
        }
      } catch (e) {
        message.reply(e);
      }
    } else {
      let successfulRequests: string[] = [];
      let failedRequests: string[] = [];
      for (let arg of args) {
        const request = this.container.classService.buildRequest(message.author, [ arg ]);
        if (!request) {
          message.reply('I was unable to build your request.');
          return;
        }
        try {
          const responseType = await this.container.classService.register(request);
          if (responseType == ClassResponseType.Success) {
            successfulRequests.push(arg);
          } else {
            failedRequests.push(arg);
          }
        } catch (e) {
          message.reply(e);
        }
      }
      let response: string[] = [];
      if (successfulRequests.length > 0) {
        response.push(`You have successfully been added to the following class(es): \
        ${successfulRequests.join(', ')}`);
      }
      if (failedRequests.length > 0) {
        response.push(`The following class(es) could not be found or are invalid: \
        ${failedRequests.join(', ')}`);
      }
      message.reply(response.join('\n'));
    }
  }
}
