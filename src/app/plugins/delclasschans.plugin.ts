import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class DeleteClassChannelsPlugin extends Plugin {
  public name: string = 'Delete classes';
  public description: string = "Nukes every class channel. Don't be idiot";
  public usage: string = 'delclasschans [super secret password]';
  public permission: ChannelType = ChannelType.Admin;

  private _CHAN_NAME: RegExp = /^[a-z]{3}[0-9]{4}[a-z]?.*$/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const channels = message.guild.channels.filter(
      (chan) => chan.type === 'text' && !!chan.name.match(this._CHAN_NAME)
    );
    const numChannels = channels.size;
    const deleteCaller = message.author.tag;

    message.reply(`Deleting **${numChannels}** channels at request of **${deleteCaller}**`);

    channels.forEach((channel, _) => {
      channel.delete();
    });
  }
}
