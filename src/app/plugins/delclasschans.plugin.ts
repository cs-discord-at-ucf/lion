import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export class DeleteClassChannelsPlugin extends Plugin {
  public name: string = ' Delete classes';
  public description: string = "Nukes every class channel. Don't be idiot";
  public usage: string = 'delclasschans [super secret password]';
  public permission: ChannelType = ChannelType.Admin;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return (
      args.join(' ') ===
      'Yes I understand that this is a really really serious thing to do and I will not be stupid and do it prematurely or maliciously.'
    );
  }

  public async execute(message: IMessage, args: string[]) {
    const channels = this.container.classService.getClasses(ClassType.ALL);
    const numChannels = channels.size;

    const deleteCaller = message.author.tag;

    await message.reply(`Deleting ${numChannels} channels at request of ${deleteCaller}`);

    channels.forEach((channel, _) => {
      console.log(`Channel ${channel.name} deleted by ${deleteCaller}`);
      channel.delete();
    });
  }
}
