import { ChannelType, IContainer, IMessage, IPlugin, RoleType } from './types';
import Constants from '../common/constants';
import { Container } from 'winston';
import { convertToObject } from 'typescript';

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
      //if this fails it simply means that a channel the bot expected to exist didn't, nothing bot breaking
      try {
        const id = this.container.guildService.getChannel(this.pluginChannelName).id;
        message.reply(`Please use this command in <#${id}>.`);
      } catch (err) {
        this.container.loggerService.warn(err);
        message.reply(`Please use this command in the \`#${this.pluginChannelName}\` channel.`);
      }
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
      let addonText = '';

      //if this fails it simply means that a channel the bot expected to exist didn't
      try {
        if (rooms.length === 0 && this.permission.toString() != 'Private') {
          addonText = 'their are no permanant channels oh this type declared.';
        } else if (rooms.length === 1) {
          let id = this.container.guildService.getChannel(rooms[0]).id;
          addonText = `, <#${id}> is the only channel whith this type`;
        } else {
          let id = [
            this.container.guildService.getChannel(rooms[0]).id,
            this.container.guildService.getChannel(rooms[1]).id,
          ];
          if (rooms.length == 2) {
            addonText = `, <#${id[0]}> and <#${id[1]}> are the only two with this channel type`;
          } else {
            addonText = `, <#${id[0]}> and <#${id[1]}> are two of the channels this channel type`;
          }
        }
      } catch (err) {
        this.container.loggerService.warn(err);
      } finally {
        message.reply(`Please use this command in a \`${this.permission}\` channel${addonText}.`);
      }
    }
    return response;
  }

  public abstract execute(message: IMessage, args?: string[]): Promise<void>;
}
