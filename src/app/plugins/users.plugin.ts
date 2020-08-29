import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IUser } from '../../common/types';
import Constants from '../../common/constants';

export class UserCountPlugin extends Plugin {
  public name: string = 'User Count Plugin';
  public description: string = 'Total member and online member count.';
  public usage: string = 'users';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const members = this.container.clientService.users.array();
    const totalMembers = this.container.guildService.get().memberCount;
    const onlineMembers = members.filter((member: IUser) => {
      return member.presence.status !== 'offline';
    }).length;
    message.reply(
      `${
      Constants.ServerName
      } server currently has **${totalMembers} members** (${onlineMembers} currently online).`
    );
  }
}
