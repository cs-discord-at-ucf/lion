import { ChannelType } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup, RoleType, ClassType } from '../../common/types';
import { ClassTAModel } from '../../schemas/class.schema';

export default class DeleteClassChannelsPlugin extends Plugin {
  public commandName: string = 'delclasschans';
  public name: string = 'Delete classes';
  public description: string = "Nukes every class channel. Don't be idiot";
  public usage: string = 'delclasschans [super secret password]';
  public override pluginAlias = [];
  public permission: ChannelGroup = ChannelGroup.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override minRoleToRun: RoleType = RoleType.Admin;

  private _CHAN_NAME: RegExp = /^[a-z]{3}[0-9]{4}[a-z]?.*$/;
  private _state: boolean = false;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    // Trigger confirmation
    if (!this._state) {
      this._state = true;

      await message.reply(
        `Are you sure you want to delete **${
          this.container.classService.getClasses(ClassType.ALL).size
        }** channels?\n\`!delclasschans <confirm | cancel>\``
      );
      return;
    }

    await this._confirm(message, args);
  }

  private async _confirm(message: IMessage, args: string[]) {
    // Reset state wether confirmed or not
    this._state = false;

    if (!args.length) {
      return;
    }

    const [shouldContinue] = args;

    // Only continue if the user typed confirm
    if (shouldContinue.toLowerCase() === 'confirm') {
      await this._deleteChannels(message);
    }
  }

  private async _deleteChannels(message: IMessage) {
    const channels = this.container.guildService
      .get()
      .channels.cache.filter(
        (chan) => chan.type === ChannelType.GuildText && !!chan.name.match(this._CHAN_NAME)
      );
    const numChannels = channels.size;
    const deleteCaller = message.author.tag;

    await message.reply(`Deleting **${numChannels}** channels at request of **${deleteCaller}**`);

    channels.forEach((channel) => {
      channel.delete();
    });

    await ClassTAModel.deleteMany({ guildID: this.container.guildService.get().id });
  }
}
