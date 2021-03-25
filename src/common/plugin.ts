import { ChannelType, IContainer, IMessage, IPlugin, RoleType } from './types';
import Constants from '../common/constants';

export abstract class Plugin implements IPlugin {
  public abstract container: IContainer;

  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get usage(): string;

  public abstract get permission(): ChannelType;

  public minRoleToRun?: RoleType;

  public pluginAlias?: string[];

  public pluginChannelName?: string;

  // Typical defaults for existing commands.
  public usableInDM = false;
  public usableInGuild = true;

  public validate(message: IMessage, args: string[]) {
    return true;
  }

  public hasPermission(message: IMessage): boolean {
    const channelName = this.container.messageService.getChannel(message).name;
    if (typeof this.pluginChannelName === 'string' && this.pluginChannelName !== channelName) {
      let channel = '';
      try {
        channel = `<#${this.container.guildService.getChannel(this.pluginChannelName).id}>`;
      } catch (err) {
        this._errorGen([this.pluginChannelName], err);
        channel = `\`#${this.pluginChannelName}\``;
      }
      message.reply(`Please use this command in the ${channel} channel.`);
      return false;
    }

    const member = message.member;
    if (!member) {
      message.reply('Could not resolve you to a member.');
      return false;
    }

    const minRoleToRun = this.minRoleToRun || 0;
    const hasRolePerms = this.container.roleService.hasPermission(member, minRoleToRun);
    if (!hasRolePerms) {
      message.reply(`You must have a higher role to run this command.`);
      return false;
    }

    const response = this.container.channelService.hasPermission(channelName, this.permission);
    if (!response) {
      const rooms = Object.values(Constants.Channels[this.permission]);
      const totalChannels = rooms.length;
      rooms.splice(3);

      let addonText = '';

      try {
        // not sure if this will cause issues as I do pop id, please let me know
        const id = rooms
          .filter((room) => {
            return this.container.guildService
              .getChannel(room)
              .permissionsFor(message.member || '')
              ?.has('VIEW_CHANNEL');
          })
          .map((room) => this.container.guildService.getChannel(room).id);

        if (this.permission.toString() === 'Private') {
          addonText = ` This is primarily the class channels, and any channels we haven't defined.`;
        } else if (id.length === 0) {
          addonText = ' There are no permanent channels of this type.';
        } else if (id.length === 1) {
          addonText = ` <#${id[0]}> is the only channel whith this type.`;
        } else {
          addonText =
            `\nHere are ${id.length} of the ${totalChannels} supported channel(s): \n` +
            `${id.map((chan) => `<#${chan}>`).join(',\n')}.`;
        }
      } catch (err) {
        this._errorGen(rooms, err);
      } finally {
        message.reply(`Please use this command in a \`${this.permission}\` channel.${addonText}`);
      }
    }
    return response;
  }

  private _errorGen(chanName: string[], err: any): void {
    this.container.loggerService.warn(
      `Expected ${chanName.join(
        ' & '
      )} in Constants.ts, but one or more were missing.  Error info:\n ${err}`
    );
  }

  public abstract execute(message: IMessage, args?: string[]): Promise<void>;
}
