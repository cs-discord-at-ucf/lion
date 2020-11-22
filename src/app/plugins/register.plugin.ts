import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class RegisterPlugin extends Plugin {
  public name: string = 'Register Plugin';
  public description: string = 'Allows for you to register classes.';
  public usage: string = 'register <class_name>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  public async execute(message: IMessage, args?: string[]) {
    if (!args) {
      return;
    }

    const successfulClasses: string[] = [];
    const invalidClasses: string[] = [];
    for (const arg of args) {
      const request = this.container.classService.buildRequest(message.author, [arg]);
      if (!request) {
        invalidClasses.push(arg);
        continue;
      }
      try {
        const response = await this.container.classService.register(request);
        if (response.includes('success')) {
          successfulClasses.push(arg);
        } else {
          invalidClasses.push(arg);
        }
      } catch (e) {
        message.reply(e);
      }
    }

    let messageForUser;
    if (successfulClasses.length === 0) {
      messageForUser = 'No classes successfully added.';
    } else {
      messageForUser = `Successfully added to ${successfulClasses.length} classes`;
    }

    if (invalidClasses.length > 0) {
      messageForUser += `\nUnable to locate these classes: ${invalidClasses.join(' ')}`;
    }
    message.reply(messageForUser);
  }
}
