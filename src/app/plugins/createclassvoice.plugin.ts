import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import {
  MessageEmbed,
  MessageReaction,
  ReactionCollector,
  TextChannel,
  User,
  VoiceChannel,
} from 'discord.js';

export default class CreateClassVoice extends Plugin {
  public commandName: string = 'createclassvoice';
  public name: string = 'Create Class Voice';
  public description: string = 'Creates a temporary voice channel for a class';
  public usage: string = 'createclassvoice';
  public pluginAlias = ['createvc'];
  public permission: ChannelType = ChannelType.Private;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const chan = message.channel as TextChannel;
    const voiceChan = await this.container.classService.createVoiceChan(message.author, chan);
    if (!voiceChan) {
      await message.reply('There is already a voice channel for this class');
      return;
    }

    const inviteMessage = await message.channel.send({ embeds: [this._createEmbed()] });
    await inviteMessage.react('🎙');

    const collector = inviteMessage.createReactionCollector(
      {
        filter: (reaction: MessageReaction, user: User) => user.id !== inviteMessage.author.id, // Only run if its not the bot putting reacts
        time: 1000 * 60 * 60 * 24,
      } // Listen for 24 hours
    );

    collector.on('collect', async (reaction: MessageReaction) => {
      const user = reaction.users.cache.last();
      if (!user) {
        return;
      }
      
      await voiceChan.permissionOverwrites.create(user.id, { VIEW_CHANNEL: true });
    });

    this.container.classService.updateClassVoice(
      chan.name,
      new ClassVoiceChan(voiceChan, chan, collector, voiceChan.members.size)
    );
  }

  private _createEmbed(): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle('Voice Channel Created');
    embed.setDescription('React with 🎙 to gain access to the voice channel');
    return embed;
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
