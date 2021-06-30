import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IUser } from '../../common/types';
import Constants from '../../common/constants';

export default class UserCountPlugin extends Plugin {
  public commandName: string = 'users';
  public name: string = 'User Count Plugin';
  public description: string = 'Total member and online member count.';
  public usage: string = 'users';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public execute(message: IMessage) {
    const members = this.container.clientService.users.cache.array();
    const totalMembers = this.container.guildService.get().memberCount;
    const onlineMembers = members.filter((member: IUser) => {
      return member.presence.status !== 'offline';
    }).length;
    message.reply(
      `${Constants.ServerName} server currently has **${totalMembers} members** (${onlineMembers} currently online).`
    );
  }
}
