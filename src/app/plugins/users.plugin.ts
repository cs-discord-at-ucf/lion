import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';
import { GuildMember } from 'discord.js';

export default class UserCountPlugin extends Plugin {
  public commandName: string = 'users';
  public name: string = 'User Count Plugin';
  public description: string = 'Total member and online member count.';
  public usage: string = 'users';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const members = await this.container.guildService.get().members.fetch();
    const totalMembers = this.container.guildService.get().memberCount;
    const onlineMembers = members.filter(
      (member: GuildMember) => !!member.presence && member.presence.status !== 'offline'
    ).size;
    message.reply(
      `${Constants.ServerName} server currently has **${totalMembers} members** (${onlineMembers} currently online).`
    );
  }
}
