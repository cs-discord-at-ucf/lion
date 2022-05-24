import { ChannelType, IContainer, IMessage, IPlugin, Voidable } from './types';
import Constants from '../common/constants';

export abstract class Plugin implements IPlugin {
  public abstract container: IContainer;

  public abstract get commandName(): string;

  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get usage(): string;

  public abstract get permission(): ChannelType;

  // REWRITE
  // set this variable's type to whatever type you created in src/common/types after importing it
  public minRoleToRun?: /*_________*/;

  public pluginAlias?: string[];

  public pluginChannelName?: string;

  public pluginCategoryName?: string;

  public commandPattern?: RegExp;

  private _numChannelsShown: number = 3;

  public isActive: boolean = true;

  // Typical defaults for existing commands.
  public usableInDM = false;
  public usableInGuild = true;

  public validate(message: IMessage, args: string[]) {
    if (!this.commandPattern) {
      return true;
    }

    return this.commandPattern.test(args.join(' '));
  }

  public hasPermission(message: IMessage): true | string {
    const channel = this.container.messageService.getChannel(message);
    const channelName = channel.name;
    const categoryName = channel.parent?.name.toLowerCase();

    if (this.pluginChannelName && this.pluginChannelName !== channelName) {
      const id = this.container.guildService.getChannel(this.pluginChannelName).id;
      return `Please use this command in the <#${id}> channel.`;
    }

    if (this.pluginCategoryName && this.pluginCategoryName.toLowerCase() !== categoryName) {
      return `Please use this command in the \`${this.pluginCategoryName}\` category.`;
    }

    const member = message.member;
    if (!member) {
      return 'Could not resolve you to a member.';
    }

    //========================
    // REWRITE
    // Expected:
    // the instance variable 'minRoleToRun' is checked against the 'member' defined in line 57
    // if the 'minRoleToRun' is not it should default to 'RegularUser' (see: src/services/role.service.ts)
    // this check is done through the 'roleService' service defined in src/services/role.service.ts
    // if the check fails, the function should terminate and 'You must have a higher role to run this command.' should be printed
    // (implement this in place of this comment)
    //========================

    const isPermitted = this.container.channelService.hasPermission(channelName, this.permission);
    if (isPermitted) {
      return true;
    }

    const baseReply = `Please use this command in a \`${this.permission}\` channel.`;

    if (this.permission.toString() === 'Private') {
      return `${baseReply} This is primarily the class channels, and any channels we haven't defined.`;
    }

    // If permission is all, get all categories and flatten to a 1D array
    const channels =
      this.permission === ChannelType.All
        ? Object.values(Constants.Channels).flatMap((el) => Object.values(el))
        : Object.values(Constants.Channels[this.permission]);

    const totalChannels = channels.length;
    channels.splice(this._numChannelsShown);

    try {
      const id = channels
        .filter((channel) => {
          return this.container.guildService
            .getChannel(channel)
            .permissionsFor(message.member ?? '')
            ?.has('VIEW_CHANNEL');
        })
        .map((room) => this.container.guildService.getChannel(room).id);

      if (id.length === 0) {
        return `${baseReply} There are no permanent channels of this type.`;
      }

      if (id.length === 1) {
        return `${baseReply} <#${id[0]}> is the only channel with this type.`;
      }

      return (
        baseReply +
        `\nHere are ${id.length} of the ${totalChannels} supported channel(s): \n` +
        `${id.map((chan) => `<#${chan}>`).join(',\n')}.`
      );
    } catch (err) {
      this._errorGen(channels, err);
    }
    return 'There was an error trying to process your request.';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _errorGen(chanName: string[], err: any): void {
    this.container.loggerService.warn(
      `Expected ${chanName.join(
        ' & '
      )} in Constants.ts, but one or more were missing.  Error info:\n ${err}`
    );
  }

  public abstract execute(message: IMessage, args?: string[]): Voidable;
}
