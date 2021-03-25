import { ChannelType, IContainer, IMessage, IPlugin, RoleType, CChannelInfo } from './types';
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
        this._errorGen([new CChannelInfo(channel, this.pluginChannelName)], err);
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
      let chanInfo: CChannelInfo[] = [];

      try {
        // not sure if this will cause issues as I do pop id, please let me know
        chanInfo = rooms
          .filter((room) => {
            return this.container.guildService
              .getChannel(room)
              .permissionsFor(message.member || '')
              ?.has('VIEW_CHANNEL');
          })
          .map((room) => new CChannelInfo(this.container.guildService.getChannel(room).id, room));

        if (this.permission.toString() === 'Private') {
          addonText = ` This is primarily the class channels, and any channels we haven't defined.`;
        } else if (chanInfo.length === 0) {
          addonText = ' There are no permanent channels of this type.';
        } else if (chanInfo.length === 1) {
          addonText = ` <#${chanInfo[0].getID()}> is the only channel whith this type.`;
        } else {
          addonText =
            `\nHere are ${chanInfo.length} of the ${totalChannels} supported channel(s): \n` +
            `${chanInfo.map((c) => `<#${c.getID()}>`).join(',\n')}.`;
        }
      } catch (err) {
        this._errorGen(chanInfo, err);
      } finally {
        message.reply(`Please use this command in a \`${this.permission}\` channel.${addonText}`);
      }
    }
    return response;
  }

  private _errorGen(chanInfo: CChannelInfo[], err: any): void {
    const formattedChanInfo = chanInfo.map(
      (channel) => `ChannelId: ${channel.getID()}, ChannelName: ${channel.getName()}`
    );
    this.container.loggerService.warn(
      `Expected ${formattedChanInfo.join(
        ' & '
      )} in Constants.ts, but one or more were missing.  Error info:\n ${err}`
    );
  }

  public abstract execute(message: IMessage, args?: string[]): Promise<void>;
}
