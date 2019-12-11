import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export class DeleteClassChannelsPlugin extends Plugin {
  public name: string = 'Delete classes';
  public description: string = "Nukes every class channel. Don't be idiot";
  public usage: string = 'delclasschans [super secret password]';
  public permission: ChannelType = ChannelType.Admin;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const channels = this.container.classService.getClasses(ClassType.ALL);
    const numChannels = channels.size;
    const deleteCaller = message.author.tag;

    message.reply(`Deleting **${numChannels}** channels at request of **${deleteCaller}**`);

    channels.forEach((channel, _) => {
      channel.delete();
    });
  }
}
