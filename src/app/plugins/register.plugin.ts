import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class RegisterPlugin extends Plugin {
  public name: string = 'Register Plugin';
  public description: string = 'Allows for you to register classes.';
  public usage: string = 'register <class_name>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  private _MAX_ALLOWED_CLASSES = 5;

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

    if (args.length > this._MAX_ALLOWED_CLASSES) {
      await message.reply(
        `Sorry, you can only register for ${this._MAX_ALLOWED_CLASSES} classes at a time.`
      );
      return;
    }

    const successfulClasses: string[] = [];
    const invalidClasses: string[] = [];
    for (const arg of args) {
      if (arg.toLowerCase() === 'all') {
        const isModerator = this.container.guildService.userHasRole(message.author, 'Moderator');
        if (!isModerator) {
          message.reply('You must be a `Moderator` to register for `all`.');
          return;
        }
      }

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
        this.container.loggerService.error(e);
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
    this.container.messageService
      .sendTextMessage(message, messageForUser, { reply: true, delimiter: ' ' })
      .catch((err) =>
        this.container.loggerService.warn(
          `Failed to give feedback to ${message.author.username} abouts registering to classes. Error info:\n${err}`
        )
      );
  }
}
