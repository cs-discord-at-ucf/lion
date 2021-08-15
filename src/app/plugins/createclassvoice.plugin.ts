import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import * as discord from 'discord.js';

export default class CreateClassVoice extends Plugin {
  public commandName: string = 'createclassvoice';
  public name: string = 'Create Class Voice';
  public description: string = 'Creates a temporary voice channel for a class';
  public usage: string = 'createclassvoice';
  public override pluginAlias = ['createvc'];
  public permission: ChannelType = ChannelType.Private;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const chan = message.channel as discord.TextChannel;
    const voiceChan = await this.container.classService.createVoiceChan(message.author, chan);
    if (!voiceChan) {
      await message.reply('There is already a voice channel for this class');
      return;
    }

    const inviteMessage = await message.channel.send(this._createEmbed());
    await inviteMessage.react('🎙');

    const collector = inviteMessage.createReactionCollector(
      {
        filter: (reaction: discord.MessageReaction, user: discord.User) =>
          user.id !== inviteMessage.author.id, // Only run if its not the bot putting reacts
        time: 1000 * 60 * 60 * 24,
      } // Listen for 24 hours
    );

    collector.on('collect', async (reaction: discord.MessageReaction) => {
      const user = reaction.users.cache.last();
      if (!user) {
        return;
      }
      await voiceChan.permissionOverwrites.create(user.id, { VIEW_CHANNEL: true });
    });

    const classVoiceObj: IClassVoiceChan = {
      voiceChan,
      classChan: chan,
      collector,
      lastUsers: voiceChan.members.size,
    };
    this.container.classService.updateClassVoice(chan.name, classVoiceObj);
  }

  private _createEmbed(): discord.MessageEmbed {
    const embed = new discord.MessageEmbed();
    embed.setTitle('Voice Channel Created');
    embed.setDescription('React with 🎙 to gain access to the voice channel');
    return embed;
  }
}

export interface IClassVoiceChan {
  voiceChan: discord.VoiceChannel;
  classChan: discord.TextChannel;
  collector: discord.ReactionCollector;
  lastUsers: number;
}
