import { User } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IEmbedData, ClassType } from '../../common/types';

export default class RegisterPlugin extends Plugin {
  public commandName: string = 'register';
  public name: string = 'Register Plugin';
  public description: string = 'Allows for you to register classes.';
  public usage: string = 'register <class_name>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  private _MAX_ALLOWED_CLASSES = 10;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.filter((arg) => !!arg).length;
  }

  public async execute(message: IMessage, args?: string[]) {
    if (!args) {
      return;
    }

    const registeredClasses = Array.from(
      this.container.classService.getClasses(ClassType.ALL).values()
    ).filter((chan) => this.container.classService.userIsRegistered(chan, message.author));

    if (!message.member) {
      return;
    }
    const isModerator = this.container.userService.hasRole(message.member, 'Moderator');
    if (!isModerator && registeredClasses.length + args.length > this._MAX_ALLOWED_CLASSES) {
      await message.reply(
        `Sorry, you can only register for ${this._MAX_ALLOWED_CLASSES} classes in total.`
      );
      return;
    }

    const results: string[] = await Promise.all(
      args.map((arg) => this._attemptAddClass(arg, message.author))
    );

    await this._giveResultsToUser(results, args, message);
  }

  private async _attemptAddClass(className: string, user: User): Promise<string> {
    if (className.toLowerCase() === 'all') {
      const isModerator = this.container.guildService.userHasRole(user, 'Moderator');
      if (!isModerator) {
        return 'You must be a `Moderator` to register for `all`.';
      }
    }

    const request = this.container.classService.buildRequest(user, [className]);
    if (!request) {
      this.container.loggerService.warn(
        `Error building request: ${JSON.stringify({ user: user.id, className: className })}`
      );
      return 'Error building request';
    }
    try {
      const response = await this.container.classService.register(request);
      if (response.includes('success')) {
        return 'success';
      } else {
        return 'invalid';
      }
    } catch (e) {
      this.container.loggerService.error(e);
    }

    return 'success';
  }

  private async _giveResultsToUser(results: string[], args: string[], message: IMessage) {
    let numSuccessfulClasses = 0;
    const invalidClasses: string[] = [];

    // Parse what worked and what did not
    results.forEach((r, i) => {
      if (r === 'success') {
        numSuccessfulClasses++;
      }
      if (r === 'invalid') {
        invalidClasses.push(args[i]);
      }
    });

    // Base string
    let messageForUser;
    if (numSuccessfulClasses === 0) {
      messageForUser = 'No classes successfully added.';
    } else {
      messageForUser = `Successfully added to ${numSuccessfulClasses} classes`;
    }

    // Nothing left to do
    if (invalidClasses.length === 0) {
      await message.reply(messageForUser);
      return;
    }

    if (this.container.classService.getClasses(ClassType.ALL).size === 0) {
      await message.reply('No classes found at this time.');
      return;
    }

    const embedMessages: IEmbedData[] = this.container.classService.getSimilarClasses(
      message,
      invalidClasses
    );

    // Ships it off to the message Service to manage sending the message and its lifespan
    await Promise.all(
      embedMessages.map((embedData) => {
        return this.container.messageService.sendReactiveMessage(
          message,
          embedData,
          this.container.classService.addClass,
          {
            reactionCutoff: 1,
            cutoffMessage: `Successfully registered to ${embedData.emojiData[0].args.classChan ||
              'N/A'}.`,
            closingMessage: `Closed registering offer to ${embedData.emojiData[0].args.classChan ||
              'N/A'}.`,
          }
        );
      })
    );
  }
}
