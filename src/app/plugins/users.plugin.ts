import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IUser } from '../../common/types';

export class UserCountPlugin extends Plugin {
  public name: string = 'User Count Plugin';
  public description: string = 'Total member and online member count.';
  public usage: string = '';
  public permission: ChannelType = ChannelType.Public;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]): boolean {
    return true;
  }

  public hasPermission(message: IMessage): boolean {
    const channelName = this.container.messageService.getChannel(message).name;
    return this.container.channelService.hasPermission(channelName, this.permission);
  }

  public execute(message: IMessage, args?: String): void {
    const members = this.container.clientService.users.array();
    const totalMembers = members.length;
    const onlineMembers = members.filter((member: IUser) => {
      return member.presence.status !== 'offline';
    }).length;
    message.reply(
      `UCF CS Discord server currently has **${totalMembers} members** (${onlineMembers} currently online).`
    );
  }
}
