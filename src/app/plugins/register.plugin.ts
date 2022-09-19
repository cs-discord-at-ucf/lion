import { MessageEmbed, User } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import {
  IContainer,
  IMessage,
  ChannelType,
  IEmbedData,
  ClassType,
  RoleType,
} from '../../common/types';

export default class RegisterPlugin extends Plugin {
  public commandName: string = 'register';
  public name: string = 'Register Plugin';
  public description: string = 'Allows for you to register classes.';
  public usage: string = 'register <class_name>';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;
  public override minRoleToRun: RoleType = RoleType.Suspended;

  private _MAX_ALLOWED_CLASSES = 10;

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]) {
    return !!args.filter((arg) => !!arg).length;
  }

  public async execute(message: IMessage, args: string[]) {
    const registeredClasses = Array.from(
      this.container.classService.getClasses(ClassType.ALL).values()
    ).filter((chan) => this.container.classService.userIsRegistered(chan, message.author));

    if (!message.member) {
      return;
    }

    const isModerator = this.container.userService.hasRole(
      message.member,
      Constants.Roles.Moderator
    );

    // Check if non-mod registers all
    if (args.some((c) => c.toLowerCase() === 'all') && !isModerator) {
      await message.reply('You must be a `Moderator` to register for all classes.');
      return;
    }

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
      this.container.loggerService.error(`register plugin ${e}`);
    }

    return 'success';
  }

  private async _giveResultsToUser(results: string[], args: string[], message: IMessage) {
    const validClasses: string[] = [];
    const invalidClasses: string[] = [];

    // Parse what worked and what did not
    results.forEach((r, i) => {
      if (r === 'success') {
        validClasses.push(args[i]);
      }
      if (r === 'invalid') {
        invalidClasses.push(args[i]);
      }
    });

    const embedAuthorData = this.container.messageService.getEmbedAuthorData(message);
    const shouldShowAuthorOnRegister = true;

    if (validClasses.length > 0) {
      // List of channel links, one per line
      const validChannels = validClasses
        .map((validClass) => {
          return this.container.classService.findClassByName(validClass);
        })
        .join('\n');

      const embed = new MessageEmbed()
        .setTitle('Successfully registered')
        .setDescription(validChannels)
        .setColor('#a3be8c');
      if (shouldShowAuthorOnRegister) {
        embed.setAuthor(embedAuthorData);
      }

      await message.reply({
        embeds: [embed],
      });
    }

    if (this.container.classService.getClasses(ClassType.ALL).size === 0) {
      await message.reply('No classes found at this time.');
      return;
    }

    const embedMessages: IEmbedData[] = this.container.classService.getSimilarClasses(
      message,
      invalidClasses,
      'register'
    );

    // Ships it off to the message Service to manage sending the message and its lifespan
    await Promise.all(
      embedMessages.map((embedData) => {
        const cutoffEmbed = new MessageEmbed()
          .setTitle('Successfully registered')
          .setDescription(String(embedData.emojiData[0].args.classChan) || 'N/A')
          .setColor('#a3be8c');
        const closingEmbed = new MessageEmbed()
          .setTitle('Closed registering offer')
          .setDescription(String(embedData.emojiData[0].args.classChan) || 'N/A')
          .setColor('#bf616a');
        if (shouldShowAuthorOnRegister) {
          cutoffEmbed.setAuthor(embedAuthorData);
          closingEmbed.setAuthor(embedAuthorData);
        }

        return this.container.messageService.sendReactiveMessage(
          message,
          embedData,
          this.container.classService.addClass,
          {
            reactionCutoff: 1,
            cutoffMessage: {
              embeds: [cutoffEmbed],
            },
            closingMessage: {
              embeds: [closingEmbed],
            },
          }
        );
      })
    );
  }
}
