import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { CategoryChannel, TextChannel } from 'discord.js';

export class CreateClassVoice extends Plugin {
  public name: string = 'Create Class Voice';
  public description: string = 'Creates a temporary voice channel for a class';
  public usage: string = 'createclassvoice';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Private;

  private _INACTIVE_THRESHOLD: number = 10;
  private _AUDIO_CAT: Maybe<CategoryChannel> = null;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length == 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const chan = message.channel as TextChannel;
    if (!this._AUDIO_CAT) {
      this._AUDIO_CAT = this.container.guildService
        .get()
        .channels.cache.filter((c) => c.name === 'Audio Channels')
        .first() as CategoryChannel;
    }

    const voiceChan = await this.container.guildService.get().channels.create(chan.name, {
      type: 'voice',
      parent: this._AUDIO_CAT,
      permissionOverwrites: chan.permissionOverwrites,
    });

    await voiceChan.createInvite().then(async (invite) => {
      await message.channel.send(`Channel Created: ${invite}`);
    });

    let numInChan = voiceChan.members.size;
    const deleteInterval = setInterval(async () => {
      const newAmount = voiceChan.members.size;

      //If there was nobody last check and no one this check
      //Remove the channel
      if (numInChan === newAmount && newAmount === 0) {
        await voiceChan.delete(`Inactive for ${this._INACTIVE_THRESHOLD} minutes`);

        this.container.loggerService.info(
          `Voice channel for #${chan.name} was deleted. Inactive for ${this._INACTIVE_THRESHOLD} minutes`
        );
        clearInterval(deleteInterval);
      } else {
        numInChan = newAmount;
      }
    }, 1000 * 60 * this._INACTIVE_THRESHOLD); //Check every _INACTIVE_THRESHOLD minutes
  }
}
