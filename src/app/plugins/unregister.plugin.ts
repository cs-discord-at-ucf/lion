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
    return args.filter((arg) => !!arg).length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    if (args[0].toLowerCase() === 'all') {
      await this._removeFromAllClasses(message);
      return;
    }

    let numSuccessfulClasses = 0;
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
          numSuccessfulClasses++;
        } else {
          invalidClasses.push(arg);
        }
      } catch (e) {
        this.container.loggerService.error(e);
      }
    }

    let messageForUser;
    if (numSuccessfulClasses === 0) {
      messageForUser = 'No classes successfully removed.';
    } else {
      messageForUser = `Successfully removed from ${numSuccessfulClasses} classes`;
    }

    if (invalidClasses.length <= 0) {
      message.reply(messageForUser);
      return;
    }

    const embedData = this.container.classService.getSimilarClasses(
      message,
      messageForUser,
      invalidClasses
    );

    // Emoji data will be empty if the server has no classes.
    if (!embedData.emojiData.length) {
      message.reply('No classes found at this time.');
      return;
    }

    // Ships it off to the message Service to manage sending the messsage and its lifespan
    this.container.messageService.sendReactiveMessage(
      message,
      embedData,
      this.container.classService.removeClass
    );
  }

  private async _removeFromAllClasses(message: IMessage) {
    const request = this.container.classService.buildRequest(message.author, ['all']);
    if (!request) {
      message.reply('Unable to complete your request.');
      return;
    }

    const response = await this.container.classService.unregister(request);
    message.reply(response);
  }
}
