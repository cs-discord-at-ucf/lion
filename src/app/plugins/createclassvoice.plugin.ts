import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageReaction, ReactionCollector, TextChannel, User, VoiceChannel } from 'discord.js';

export class CreateClassVoice extends Plugin {
  public name: string = 'Create Class Voice';
  public description: string = 'Creates a temporary voice channel for a class';
  public usage: string = 'createclassvoice';
  public pluginAlias = ['createvc'];
  public permission: ChannelType = ChannelType.Private;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const chan = message.channel as TextChannel;
    const voiceChan = await this.container.classService.createVoiceChan(message.author, chan);
    if (!voiceChan) {
      await message.reply('There is already a voice channel for this class');
      return;
    }
    const inviteMessage = await voiceChan.createInvite().then(async (invite) => {
      return await message.channel.send(`React to join acess to the voice channel: ${invite}`);
    });

    await inviteMessage.react('🎙');
    const collector = inviteMessage.createReactionCollector(
      (reaction: MessageReaction, user: User) => user.id !== inviteMessage.author.id, //Only run if its not the bot putting reacts
      {
        time: 1000 * 60 * 60 * 24,
      } //Listen for 24 hours
    );

    collector.on('collect', async (reaction: MessageReaction) => {
      const user = reaction.users.cache.last();
      if (!user) {
        return;
      }
      voiceChan.createOverwrite(user.id, { VIEW_CHANNEL: true });
    });

    this.container.classService.udpateClassVoice(
      chan.name,
      new ClassVoiceChan(voiceChan, chan, collector, voiceChan.members.size)
    );
  }
}

export class ClassVoiceChan {
  voiceChan: VoiceChannel;
  classChan: TextChannel;
  collector: ReactionCollector;
  lastUsers: number;

  constructor(
    _chan: VoiceChannel,
    _classChan: TextChannel,
    _collector: ReactionCollector,
    _numUsers: number
  ) {
    this.voiceChan = _chan;
    this.classChan = _classChan;
    this.collector = _collector;
    this.lastUsers = _numUsers;
  }
}
