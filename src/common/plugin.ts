import { ChannelType, IContainer, IMessage, IPlugin, RoleType } from './types';

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
      message.reply(`Please use this command in the \`#${this.pluginChannelName}\` channel.`);
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
      message.reply(`Please use this command in a \`${this.permission}\` channel`);
    }
    return response;
  }

  public abstract execute(message: IMessage, args?: string[]): Promise<void>;
}
