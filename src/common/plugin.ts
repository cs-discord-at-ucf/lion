import { ChannelType, IContainer, IMessage, IPlugin, RoleType, Voidable } from './types';
import Constants from '../common/constants';

export abstract class Plugin implements IPlugin {
  public abstract container: IContainer;

  public abstract get commandName(): string;

  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get usage(): string;

  public abstract get permission(): ChannelType;

  public minRoleToRun?: RoleType;

  public pluginAlias?: string[];

  public pluginChannelName?: string;

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

  public hasPermission(message: IMessage): boolean {
    const channelName = this.container.messageService.getChannel(message).name;
    if (typeof this.pluginChannelName === 'string' && this.pluginChannelName !== channelName) {
      const id = this.container.guildService.getChannel(this.pluginChannelName).id;
      message.reply(`Please use this command in the <#${id}> channel.`);
      return false;
    }

    const member = message.member;
    if (!member) {
      message.reply('Could not resolve you to a member.');
      return false;
    }

    const minRoleToRun = this.minRoleToRun ?? 0;
    const hasRolePerms = this.container.roleService.hasPermission(member, minRoleToRun);
    if (!hasRolePerms) {
      message.reply('You must have a higher role to run this command.');
      return false;
    }

    const response = this.container.channelService.hasPermission(channelName, this.permission);
    if (!response) {
      const baseReply = `Please use this command in a \`${this.permission}\` channel.`;

      if (this.permission.toString() === 'Private') {
        message.reply(
          `${baseReply} This is primarily the class channels, and any channels we haven't defined.`
        );
        return response;
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
          message.reply(`${baseReply} There are no permanent channels of this type.`);
          return response;
        }

        if (id.length === 1) {
          message.reply(`${baseReply} <#${id[0]}> is the only channel with this type.`);
          return response;
        }

        message.reply(
          baseReply +
            `\nHere are ${id.length} of the ${totalChannels} supported channel(s): \n` +
            `${id.map((chan) => `<#${chan}>`).join(',\n')}.`
        );
      } catch (err) {
        this._errorGen(channels, err);
      }
    }
    return response;
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
