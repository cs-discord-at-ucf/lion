import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup } from '../../common/types';
import Constants from '../../common/constants';
import { GuildMember } from 'discord.js';

export default class UserCountPlugin extends Plugin {
  public commandName: string = 'users';
  public name: string = 'User Count Plugin';
  public description: string = 'Total member and online member count.';
  public usage: string = 'users';
  public override pluginAlias = [];
  public permission: ChannelGroup = ChannelGroup.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public execute(message: IMessage) {
    const members = [...this.container.guildService.get().members.cache.values()];
    const totalMembers = this.container.guildService.get().memberCount;
    const onlineMembers = members.filter((member: GuildMember) => {
      return member.presence?.status !== 'offline';
    }).length;
    message.reply(
      `${Constants.ServerName} server currently has **${totalMembers} members** (${onlineMembers} currently online).`
    );
  }
}
