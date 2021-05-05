import { MessageEmbed } from 'discord.js';
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

    let numSuccessfulClasses = 0;
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
      messageForUser = 'No classes successfully added.';
    } else {
      messageForUser = `Successfully added to ${numSuccessfulClasses} classes`;
    }

    if (invalidClasses.length <= 0) {
      message.reply(messageForUser);
      return;
    }

    const embededMessage = new MessageEmbed();

    messageForUser +=
      `\nUnable to locate the following classes: ${invalidClasses.join(' ')}` +
      `Below you can find suggestions for each incorrect input:`;

    embededMessage.setColor('#0099ff').setTitle('Atleast One Class Not Found');
    embededMessage.setDescription(messageForUser);

    invalidClasses.forEach((invalidClass: string) => {
      embededMessage.addField(
        `${invalidClass}`,
        this.container.classService.findSimilarClasses(invalidClass).join('\n'),
        true
      );
    });

    message.reply(embededMessage);
  }
}
