import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class UnregisterPlugin extends Plugin {
  public name: string = 'Unregister Plugin';
  public description: string = 'Allows for you to unregister classes.';
  public usage: string = 'unregister <class_name>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    if (args[0].toLowerCase() === 'all') {
      await this._removeFromAllClasses(message);
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
        const response = await this.container.classService.unregister(request);
        if (response.includes('success')) {
          successfulClasses.push(arg);
        } else {
          invalidClasses.push(arg);
        }
      } catch (e) {
        this.container.loggerService.error(e);
      }
    }

    let messageForUser;
    if (successfulClasses.length === 0) {
      messageForUser = 'No classes successfully removed.';
    } else {
      messageForUser = `Successfully removed from ${successfulClasses.length} classes`;
    }

    if (invalidClasses.length > 0) {
      messageForUser += `\nUnable to locate these classes: ${invalidClasses.join(' ')}`;
    }
    message.reply(messageForUser);
  }

  private async _removeFromAllClasses(message: IMessage) {
    const request = this.container.classService.buildRequest(message.author, ['all']);
    if (!request) {
      message.reply('Unable to complete your request.');
      return;
    }

    const reponse = await this.container.classService.unregister(request);
    console.log(reponse);

    message.reply('Successfully removed from all classes');
  }
}
