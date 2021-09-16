import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, RoleType } from '../../common/types';

export default class DeleteClassChannelsPlugin extends Plugin {
  public commandName: string = 'delclasschans';
  public name: string = 'Delete classes';
  public description: string = "Nukes every class channel. Don't be idiot";
  public usage: string = 'delclasschans [super secret password]';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override minRoleToRun: RoleType = RoleType.Admin;

  private _CHAN_NAME: RegExp = /^[a-z]{3}[0-9]{4}[a-z]?.*$/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const channels = this.container.guildService
      .get()
      .channels.cache.filter((chan) => chan.type === 'GUILD_TEXT' && !!chan.name.match(this._CHAN_NAME));
    const numChannels = channels.size;
    const deleteCaller = message.author.tag;

    await message.reply(`Deleting **${numChannels}** channels at request of **${deleteCaller}**`);

    channels.forEach((channel) => {
      channel.delete();
    });
  }
}
