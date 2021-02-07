import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { TextChannel, VoiceChannel } from 'discord.js';

export class CreateClassVoice extends Plugin {
  public name: string = 'Create Class Voice';
  public description: string = 'Creates a temporary voice channel for a class';
  public usage: string = 'createclassvoice';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Private;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length == 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const chan = message.channel as TextChannel;
    const voiceChan = await this.container.classService.createVoiceChan(chan);
    if (!voiceChan) {
      await message.reply('There is already a voice channel for this class');
      return;
    }

    await voiceChan.createInvite().then(async (invite) => {
      await message.channel.send(`Channel Created: ${invite}`);
    });
  }
}

export class ClassVoiceChan {
  voiceChan: VoiceChannel;
  classChan: TextChannel;
  lastUsers: number;

  constructor(_chan: VoiceChannel, _classChan: TextChannel, _numUsers: number) {
    this.voiceChan = _chan;
    this.classChan = _classChan;
    this.lastUsers = _numUsers;
  }
}
