import {
  Guild,
  GuildChannel,
  Permissions,
  CategoryChannel,
  TextChannel,
  VoiceChannel,
  User,
  MessageEmbed,
} from 'discord.js';
import {
  IUser,
  Maybe,
  IMessage,
  ClassType,
  RequestType,
  IEmojiTable,
  IEmbedData,
  IClassRequest,
} from '../common/types';
import { ClassVoiceChan } from '../app/plugins/createclassvoice.plugin';
import { GuildService } from './guild.service';
import { LoggerService } from './logger.service';
import levenshtein from 'js-levenshtein';
export class ClassService {
  private _guild: Guild;
  private _loggerService: LoggerService;
  private _channels = new Map<ClassType, Map<string, GuildChannel>>();

  // When someone is allowed in a channel the bitfield value is the sum of their permissionOverwrites
  private _ALLOW_BITFIELD = Permissions.FLAGS.VIEW_CHANNEL + Permissions.FLAGS.SEND_MESSAGES;
  private _DENY_BITFIELD = BigInt(0);
  private _MAX_CLASS_LIST_LEN = 1600;

  private _classVoiceChans: Map<string, ClassVoiceChan> = new Map();
  private _CLASS_VC_CAT: Maybe<CategoryChannel> = null;

  constructor(private _guildService: GuildService, _loggerService: LoggerService) {
    this._guild = this._guildService.get();
    this._loggerService = _loggerService;
    this._addClasses();
  }

  public getClasses(classType: ClassType): Map<string, GuildChannel> {
    if (classType === ClassType.ALL) {
      const ret = new Map<string, GuildChannel>();
      for (const classType of Object.keys(ClassType).filter((k) => k !== ClassType.ALL)) {
        for (const [key, value] of this.getClasses(this.resolveClassType(classType)).entries()) {
          ret.set(key, value);
        }
      }
      return ret;
    }
    return this._channels.get(classType) ?? new Map<string, GuildChannel>();
  }

  public userIsRegistered(chan: GuildChannel, user: User) {
    const perms = chan.permissionOverwrites.cache.get(user.id);
    if (!perms) {
      return false;
    }

    return perms.allow.bitfield === this._ALLOW_BITFIELD;
  }

  public getSimilarClasses(message: IMessage, invalidClasses: string[]): IEmbedData[] {
    return invalidClasses.map((invalidClass: string) => {
      const emojiData: IEmojiTable[] = [];
      const embeddedMessage: MessageEmbed = new MessageEmbed();

      embeddedMessage.setColor('#0099ff').setTitle(`${invalidClass} Not Found`);

      const [similarClassID] = this.findSimilarClasses(invalidClass);

      // TODO check if similarity is close then decide whether to return the guess or tell them to get a mod.

      embeddedMessage.setDescription(`Did you mean \`${similarClassID}.\``);

      // EmojiData acts as a key.
      emojiData.push({
        emoji: '✅',
        args: {
          classChan: this.findClassByName(similarClassID),
          user: message.author,
        }, // This matches with IRegisterData interface from class.service
      });

      return { embeddedMessage: { embeds: [embeddedMessage] }, emojiData: emojiData };
    });
  }

  async register(request: IClassRequest): Promise<string> {
    const { author, categoryType, className } = request;
    try {
      if (!categoryType) {
        // Since category types are only dealt with registration of categories,
        // we are handling an individual class registration.
        if (!className) {
          throw new Error('No class name detected');
        }
        const classObj = this.findClassByName(className);
        if (!classObj) {
          throw new Error('Unable to locate this class');
        }
        return this.addClass({ classChan: classObj, user: author });
      } else {
        // The user has requested to registered for all classes.
        return await this._registerAll(author, categoryType);
      }
    } catch (e) {
      return `${e}`;
    }
  }

  // Any data that hits this function is already known data so no checks needed
  async addClass(classData: IRegisterData): Promise<string> {
    await classData.classChan.permissionOverwrites.create(classData.user.id, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
    });
    return `You have successfully been added to ${classData.classChan}`;
  }

  async unregister(request: IClassRequest): Promise<string> {
    const { author, categoryType, className } = request;
    try {
      if (!categoryType) {
        // Since category types are only dealt with registration of categories,
        // we are handling an individual class registration.
        if (!className) {
          throw new Error('No class name detected');
        }
        const classObj = this.findClassByName(className);
        if (!classObj) {
          throw new Error('Unable to locate this class');
        }

        return this.removeClass({ classChan: classObj, user: author });
      } else {
        // The user has requested to unregister from all classes.
        return await this._unregisterAll(author, categoryType);
      }
    } catch (e) {
      return `${e}`;
    }
  }

  // Any data that hits this function is already known data so no checks needed
  async removeClass(classData: IRegisterData): Promise<string> {
    await classData.classChan.permissionOverwrites.create(classData.user.id, {
      VIEW_CHANNEL: false,
      SEND_MESSAGES: false,
    });
    return `You have successfully been removed from ${classData.classChan}`;
  }

  public buildRequest(author: IUser, args: string[] | undefined): IClassRequest | undefined {
    if (!args) {
      return undefined;
    }
    args = args.map((arg) => arg.toUpperCase());
    let categoryType: ClassType | undefined = undefined;
    let requestType: RequestType;
    let className: string = '';

    if (args.length === 2) {
      const category = args[1];
      categoryType = this.resolveClassType(category);
    }

    if (!categoryType) {
      requestType = RequestType.Channel;
      className = args[0];
    } else {
      requestType = RequestType.Category;
    }

    // In the case of a user inputting `!register all`, we will need to take care of this corner case.
    if (args.length === 1 && args[0] === ClassType.ALL) {
      requestType = RequestType.Category;
      categoryType = ClassType.ALL;
      args[0] = '';
    }

    return {
      author,
      categoryType,
      requestType,
      className,
    };
  }

  public updateClasses(): void {
    this._channels.clear();
    this._addClasses();
  }

  private _addClasses(): void {
    this._guild.channels.cache.forEach((channel) => {
      if (!channel.parentID) {
        return;
      }

      const category = this._guild.channels.cache.get(channel.parentID);

      if (category?.name.toLowerCase().includes('classes')) {
        for (const classType of Object.keys(ClassType).filter((k) => k !== ClassType.ALL)) {
          if (category.name.toUpperCase().startsWith(classType)) {
            const classes = this.getClasses(this.resolveClassType(classType));

            if (!(channel instanceof GuildChannel)) {
              continue;
            }

            classes.set(channel.name, channel);
            this._channels.set(this.resolveClassType(classType), classes);
          }
        }
      }
    });
  }

  public resolveClassType(classType: string): ClassType {
    return ClassType[classType as keyof typeof ClassType];
  }

  public buildClassListText(classType: string): string[] {
    const classGroupsToList =
      classType === ClassType.ALL
        ? Object.keys(ClassType).filter((k) => k !== ClassType.ALL)
        : [classType];

    const responses = [];
    for (const classType of classGroupsToList) {
      const classNames = Array.from(
        this.getClasses(this.resolveClassType(classType)),
        ([, v]) => v.name
      ).sort();

      const startOfResponse = `\`\`\`\n${classType} Classes:`;
      let currentResponse = startOfResponse;
      for (const className of classNames) {
        if (currentResponse.length + className.length + 4 >= this._MAX_CLASS_LIST_LEN) {
          currentResponse += '\n```';
          responses.push(currentResponse);
          currentResponse = startOfResponse;
          console.log(currentResponse);
        }
        currentResponse += `\n${className}`;
      }

      if (currentResponse.length) {
        currentResponse += '\n```';
        responses.push(currentResponse);
      }
    }

    return responses;
  }

  public isClassChannel(className: string): boolean {
    return Boolean(this.findClassByName(className));
  }

  private async _registerAll(author: IUser, categoryType: ClassType): Promise<string> {
    if (!categoryType) {
      categoryType = ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [, channel] = classObj;

      if (this.userIsRegistered(channel, author)) {
        continue;
      }
      await channel.permissionOverwrites.create(author.id, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
    }
    return `You have successfully been added to the ${categoryType} category.`;
  }

  private async _unregisterAll(
    author: IUser,
    categoryType: ClassType | undefined
  ): Promise<string> {
    if (!categoryType) {
      categoryType = ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [, channel] = classObj;

      const currentPerms = channel.permissionOverwrites.cache.get(author.id);
      if (currentPerms) {
        // Bitfield is 0 for deny, 1 for allow
        if (currentPerms.allow.bitfield === this._DENY_BITFIELD) {
          continue;
        }
      }
      await channel.permissionOverwrites.create(author.id, {
        VIEW_CHANNEL: false,
        SEND_MESSAGES: false,
      });
    }
    return `You have successfully been removed from the ${categoryType} category.`;
  }

  public findClassByName(className: string) {
    className = className.toLowerCase();
    const classes = this.getClasses(ClassType.ALL);
    for (const classObj of classes) {
      const [classChanName, classChanObj] = classObj;
      if (classChanName === className) {
        return classChanObj;
      }
    }
    return undefined;
  }

  public findSimilarClasses(className: string) {
    className = className.toLowerCase();
    const classes: string[] = Array.from(this.getClasses(ClassType.ALL).keys());

    // Returns 10 most likely classes, if the caller wants less it can manage it.
    return classes
      .sort((a: string, b: string) => levenshtein(className, a) - levenshtein(className, b))
      .splice(0, 10);
  }

  public getVoiceChannels() {
    return this._classVoiceChans;
  }

  public async createVoiceChan(user: User, classChan: TextChannel): Promise<Maybe<VoiceChannel>> {
    if (this._classVoiceChans.get(classChan.name)) {
      return null;
    }

    if (!this._CLASS_VC_CAT) {
      this._CLASS_VC_CAT = this._guildService.getChannel('class voice') as CategoryChannel;
    }

    const everyoneRole = this._guildService.getRole('@everyone');
    return this._guild.channels.create(classChan.name, {
      type: 'voice',
      parent: this._CLASS_VC_CAT,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: ['VIEW_CHANNEL'],
        },
        {
          id: user.id,
          allow: ['VIEW_CHANNEL', 'MANAGE_CHANNELS'],
        },
      ],
    });
  }

  public async deleteVoiceChan(name: string) {
    const vcObj = this._classVoiceChans.get(name);
    if (!vcObj) {
      return;
    }

    if (!vcObj.voiceChan.deleted) {
      await vcObj.voiceChan.delete('Inactive');
    }

    vcObj.collector.endReason;
    this._classVoiceChans.delete(name);
  }

  public updateClassVoice(name: string, vcObj: ClassVoiceChan) {
    this._classVoiceChans.set(name, vcObj);
  }
}

export interface IRegisterData {
  classChan: GuildChannel;
  user: User;
}
