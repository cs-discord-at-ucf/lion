import * as discord from 'discord.js';
import levenshtein from 'js-levenshtein';
import { IClassVoiceChan } from '../app/plugins/createclassvoice.plugin';
import * as types from '../common/types';
import { GuildService } from './guild.service';
import { LoggerService } from './logger.service';
import { MessageService } from './message.service';
export class ClassService {
  private _guild: discord.Guild;
  private _loggerService: LoggerService;
  private _messageService: MessageService;
  private _channels = new Map<types.ClassType, Map<string, discord.GuildChannel>>();

  // When someone is allowed in a channel the bitfield value is the sum of their permissionOverwrites
  private _ALLOW_BITFIELD =
    discord.Permissions.FLAGS.VIEW_CHANNEL + discord.Permissions.FLAGS.SEND_MESSAGES;
  private _DENY_BITFIELD = 0;
  private _MAX_CLASS_LIST_LEN = 1600;

  private _classVoiceChans: Map<string, IClassVoiceChan> = new Map();
  private _CLASS_VC_CAT: types.Maybe<discord.CategoryChannel> = null;

  constructor(
    private _guildService: GuildService,
    _loggerService: LoggerService,
    _messageService: MessageService
  ) {
    this._guild = this._guildService.get();
    this._loggerService = _loggerService;
    this._messageService = _messageService;
    this._addClasses();
  }

  public getClasses(classType: types.ClassType): Map<string, discord.GuildChannel> {
    if (classType === types.ClassType.ALL) {
      const ret = new Map<string, discord.GuildChannel>();
      for (const classType of Object.keys(types.ClassType).filter(
        (k) => k !== types.ClassType.ALL
      )) {
        for (const [key, value] of this.getClasses(this.resolveClassType(classType)).entries()) {
          ret.set(key, value);
        }
      }
      return ret;
    }
    return this._channels.get(classType) ?? new Map<string, discord.GuildChannel>();
  }

  public userIsRegistered(chan: discord.GuildChannel, user: discord.User) {
    const perms = chan.permissionOverwrites.cache.get(user.id);
    if (!perms) {
      return false;
    }

    return perms.allow.bitfield === this._ALLOW_BITFIELD;
  }

  public getSimilarClasses(
    interaction: discord.CommandInteraction,
    invalidClasses: string[],
    action: 'register' | 'unregister'
  ): types.IInteractionEmbedData[] {
    return invalidClasses.map((invalidClass: string) => {
      const emojiData: types.IButtonLabelTable[] = [];
      const embeddedMessage: discord.MessageEmbed = new discord.MessageEmbed();

      embeddedMessage.setColor('#0099ff').setTitle(`${invalidClass} Not Found`);
      const shouldShowAuthorOnRegister = true;
      if (shouldShowAuthorOnRegister) {
        embeddedMessage.setAuthor(this._messageService.getEmbedAuthorData(interaction));
      }

      const [similarClassID] = this.findSimilarClasses(invalidClass);

      // TODO check if similarity is close then decide whether to return the guess or tell them to get a mod.

      embeddedMessage.setDescription(`Did you mean \`${similarClassID}\`?\n`);

      // EmojiData acts as a key.
      emojiData.push({
        buttonData: {
          type: 'BUTTON',
          style: 'SUCCESS',
          label: action === 'register' ? 'Register' : 'Unregister',
          customId: 'classRegister',
        },
        args: {
          classChan: this.findClassByName(similarClassID),
          user: interaction.user,
        } as IRegisterData,
      });

      return { embeddedMessage: embeddedMessage, emojiData: emojiData };
    });
  }

  async register(request: types.IClassRequest): Promise<string> {
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

  async unregister(request: types.IClassRequest): Promise<string> {
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

  public buildRequest(
    author: types.IUser,
    args: string[] | undefined
  ): types.IClassRequest | undefined {
    if (!args) {
      return undefined;
    }
    args = args.map((arg) => arg.toUpperCase());
    let categoryType: types.ClassType | undefined = undefined;
    let requestType: types.RequestType;
    let className: string = '';

    if (args.length === 2) {
      const category = args[1];
      categoryType = this.resolveClassType(category);
    }

    if (!categoryType) {
      requestType = types.RequestType.Channel;
      className = args[0];
    } else {
      requestType = types.RequestType.Category;
    }

    // In the case of a user inputting `!register all`, we will need to take care of this corner case.
    if (args.length === 1 && args[0] === types.ClassType.ALL) {
      requestType = types.RequestType.Category;
      categoryType = types.ClassType.ALL;
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
      if (channel.isThread()) {
        return;
      }

      if (!channel.parentId) {
        return;
      }

      const category = this._guild.channels.cache.get(channel.parentId);

      if (category?.name.toLowerCase().includes('classes')) {
        for (const classType of Object.keys(types.ClassType).filter(
          (k) => k !== types.ClassType.ALL
        )) {
          if (category.name.toUpperCase() === `${classType}-CLASSES`) {
            const classes = this.getClasses(this.resolveClassType(classType));
            classes.set(channel.name, channel);
            this._channels.set(this.resolveClassType(classType), classes);
          }
        }
      }
    });
  }

  public resolveClassType(classType: string): types.ClassType {
    return types.ClassType[classType as keyof typeof types.ClassType];
  }

  public buildClassListText(classType: string): string[] {
    const classGroupsToList =
      classType === types.ClassType.ALL
        ? Object.keys(types.ClassType).filter((k) => k !== types.ClassType.ALL)
        : [classType];

    const responses = [];
    for (const classType of classGroupsToList) {
      const classNames = Array.from(
        this.getClasses(this.resolveClassType(classType)),
        ([, v]) => v.name
      ).sort();

      const startOfResponse = `## ${classType} Classes:`;
      let currentResponse = startOfResponse;
      for (const className of classNames) {
        if (currentResponse.length + className.length + 4 >= this._MAX_CLASS_LIST_LEN) {
          currentResponse += '\n```';
          responses.push(currentResponse);
          currentResponse = startOfResponse;
          console.log(currentResponse);
        }
        currentResponse += `\n- \`${className}\``;
      }

      if (currentResponse.length) {
        currentResponse += '\n';
        responses.push(currentResponse);
      }
    }

    return responses;
  }

  public isClassChannel(className: string): boolean {
    return Boolean(this.findClassByName(className));
  }

  private async _registerAll(author: types.IUser, categoryType: types.ClassType): Promise<string> {
    if (!categoryType) {
      categoryType = types.ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [, channel] = classObj;

      if (this.userIsRegistered(channel, author)) {
        continue;
      }
      await channel.permissionOverwrites.create(author.id, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
      });
    }
    return `You have successfully been added to the ${categoryType} category.`;
  }

  private async _unregisterAll(
    author: types.IUser,
    categoryType: types.ClassType | undefined
  ): Promise<string> {
    if (!categoryType) {
      categoryType = types.ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [, channel] = classObj;

      const currentPerms = channel.permissionOverwrites.cache.get(author.id);
      if (currentPerms) {
        // Bitfield is 0 for deny, 1 for allow
        if (currentPerms.allow.equals(BigInt(this._DENY_BITFIELD))) {
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
    const classes = this.getClasses(types.ClassType.ALL);
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
    const classes: string[] = Array.from(this.getClasses(types.ClassType.ALL).keys());

    // Returns 10 most likely classes, if the caller wants less it can manage it.
    return classes
      .sort((a: string, b: string) => levenshtein(className, a) - levenshtein(className, b))
      .splice(0, 10);
  }

  public getVoiceChannels() {
    return this._classVoiceChans;
  }

  public async createVoiceChan(
    user: discord.User,
    classChan: discord.TextChannel
  ): Promise<types.Maybe<discord.VoiceChannel>> {
    if (this._classVoiceChans.get(classChan.name)) {
      return null;
    }

    if (!this._CLASS_VC_CAT) {
      this._CLASS_VC_CAT = this._guildService.getChannel('class voice') as discord.CategoryChannel;
    }

    const everyoneRole = this._guildService.getRole('@everyone');
    return this._guild.channels.create(classChan.name, {
      type: 'GUILD_VOICE',
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
      await vcObj.voiceChan.delete();
    }

    vcObj.collector.stop();
    this._classVoiceChans.delete(name);
  }

  public updateClassVoice(name: string, vcObj: IClassVoiceChan) {
    this._classVoiceChans.set(name, vcObj);
  }
}

export interface IRegisterData {
  classChan: discord.GuildChannel;
  user: discord.User;
}
