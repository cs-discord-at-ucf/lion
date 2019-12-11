import { Guild, GuildChannel } from 'discord.js';
import { ClassType, IUser, IClassRequest, RequestType } from '../common/types';
import { GuildService } from './guild.service';

export class ClassService {
  private _guild: Guild;
  private _channels = new Map<ClassType, Map<string, GuildChannel>>();

  constructor(private _guildService: GuildService) {
    this._guild = this._guildService.get();
    this._addClasses();
  }

  getClasses(classType: ClassType): Map<string, GuildChannel> {
    if (classType === ClassType.ALL) {
      return new Map<string, GuildChannel>([
        ...this.getClasses(ClassType.CS),
        ...this.getClasses(ClassType.IT),
      ]);
    }
    return this._channels.get(classType) || new Map<string, GuildChannel>();
  }

  async register(request: IClassRequest): Promise<string> {
    const { author, categoryType, className } = request;
    try {
      if (categoryType === null) {
        // Since category types are only dealt with registration of categories,
        // we are handling an individual class registration.
        if (!className) {
          throw new Error('No class name detected');
        }
        const classObj = this._findClassByName(className);
        if (!classObj) {
          throw new Error('Unable to locate this class');
        }
        await classObj.overwritePermissions(author, { READ_MESSAGES: true, SEND_MESSAGES: true });
        return `You have successfully been added to ${className}`;
      } else {
        // The user has requested to registered for all classes.
        return await this._registerAll(author, categoryType);
      }
    } catch (e) {
      return `${e}`;
    }
  }

  async unregister(request: IClassRequest): Promise<string> {
    const { author, categoryType, className } = request;
    try {
      if (categoryType === null) {
        // Since category types are only dealt with registration of categories,
        // we are handling an individual class registration.
        if (!className) {
          throw new Error('No class name detected');
        }
        const classObj = this._findClassByName(className);
        if (!classObj) {
          throw new Error('Unable to locate this class');
        }
        await classObj.overwritePermissions(author, { READ_MESSAGES: false, SEND_MESSAGES: false });
        return `You have successfully been removed from ${className}`;
      } else {
        // The user has requested to unregister from all classes.
        return await this._unregisterAll(author, categoryType);
      }
    } catch (e) {
      return `${e}`;
    }
  }

  buildRequest(author: IUser, args: string[] | undefined): IClassRequest | undefined {
    if (!args) {
      return undefined;
    }
    args = args.map((arg) => arg.toUpperCase());
    let categoryType: ClassType | null = null;
    let requestType: RequestType;
    let className: string = '';

    if (args.length === 2) {
      const category = args[1];
      if (category === ClassType.CS) {
        categoryType = ClassType.CS;
      } else if (category === ClassType.IT) {
        categoryType = ClassType.IT;
      }
    }

    if (categoryType === null) {
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
    this._guild.channels.forEach((channel) => {
      const category = this._guild.channels.get(channel.parentID);

      if (!!category && category.name.includes('classes')) {
        if (category.name.toUpperCase().startsWith(ClassType.CS)) {
          const classes = this.getClasses(ClassType.CS);
          classes.set(channel.name, channel);
          this._channels.set(ClassType.CS, classes);
        } else {
          const classes = this.getClasses(ClassType.IT);
          classes.set(channel.name, channel);
          this._channels.set(ClassType.IT, classes);
        }
      }
    });
  }

  private async _registerAll(author: IUser, categoryType: ClassType): Promise<string> {
    if (!categoryType) {
      categoryType = ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [guild, channel] = classObj;
      await channel.overwritePermissions(author, { READ_MESSAGES: true, SEND_MESSAGES: true });
    }
    return `You have successfully been added to the ${categoryType} category.`;
  }

  private async _unregisterAll(author: IUser, categoryType: ClassType): Promise<string> {
    if (!categoryType) {
      categoryType = ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [guild, channel] = classObj;
      await channel.overwritePermissions(author, { READ_MESSAGES: false, SEND_MESSAGES: false });
    }
    return `You have successfully been removed from the ${categoryType} category.`;
  }

  private _findClassByName(className: string) {
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
}
