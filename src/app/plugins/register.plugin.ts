import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { IEmojiTable } from './../../common/types';
export class RegisterPlugin extends Plugin {
  public name: string = 'Register Plugin';
  public description: string = 'Allows for you to register classes.';
  public usage: string = 'register <class_name>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  private _EMOJI_REACTIONS: string[] = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  private _MAX_ALLOWED_CLASSES = 5;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.filter((args) => !!args).length;
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
      `\n${message.author}, Unable to locate the following classes: ${invalidClasses.join(' ')}\n` +
      `Below you can find suggestions for each incorrect input:`;

    embededMessage.setColor('#0099ff').setTitle('Atleast One Class Not Found');
    embededMessage.setDescription(messageForUser);

    const emojiData: IEmojiTable[] = [];
    invalidClasses.forEach((invalidClass: string, i) => {
      const curEmote = this._EMOJI_REACTIONS[i];
      const similarClassID =
        this.container.classService.findSimilarClasses(invalidClass)[0] || 'Nothing Found.';

      // EmojiData acts as a key.
      emojiData.push({
        emoji: curEmote,
        args: {
          classChan: this.container.classService.findClassByName(similarClassID),
          user: message.author,
        }, // This matches with IRegisterData interface from class.service
      });

      embededMessage.addField(`${invalidClass}`, `${curEmote} ${similarClassID}`, true);
    });

    // Ships it off to the emssage Service to manage sending the messsage and its lifespan
    this.container.messageService.sendReactiveMessage(
      message,
      embededMessage,
      emojiData,
      this.container.classService.addClass
    );
  }
}
