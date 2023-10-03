import * as discord from 'discord.js';
import ms from 'ms';
import { Command } from '../../common/slash';
import { Maybe } from '../../common/types';

export interface IClassVoiceChan {
  voiceChan: discord.VoiceChannel;
  classChan: discord.TextChannel;
  collector: Maybe<discord.InteractionCollector<discord.ButtonInteraction>>;
  lastUsers: number;
}

export default {
  commandName: 'createclassvoice',
  name: 'Create Class Voice',
  description: 'Creates a temporary voice channel for a class',
  async execute({ interaction, container }) {
    const chan = interaction.channel! as discord.TextChannel;
    if (!container.classService.isClassChannel(chan.name)) {
      await interaction.reply({
        content: 'This is not a class channel',
        ephemeral: true,
      });
      return;
    }

    const voiceChan = await container.classService.createVoiceChan(interaction.user, chan);
    if (!voiceChan) {
      await interaction.reply({
        content: 'There is already a voice channel for this class',
        ephemeral: true,
      });
      return;
    }

    const inviteMessage = await interaction.channel!.send({
      embeds: [createEmbed()],
      components: [
        new discord.MessageActionRow().addComponents(
          new discord.MessageButton().setCustomId('join').setLabel('Join').setStyle('PRIMARY')
        ),
      ],
    });
    await interaction.reply({ content: 'Voice channel created', ephemeral: true });

    const collector = inviteMessage.createMessageComponentCollector({
      componentType: 'BUTTON',
      time: ms('1d'),
    });

    collector.on('collect', async (buttonReaction) => {
      const user = buttonReaction.user;
      if (!user) {
        return;
      }

      await voiceChan.permissionOverwrites.create(user.id, { VIEW_CHANNEL: true });
      await interaction.reply({
        content: 'You have been added to the voice channel',
        ephemeral: true,
      });
    });

    const classVoiceObj: IClassVoiceChan = {
      voiceChan,
      classChan: chan,
      collector,
      lastUsers: voiceChan.members.size,
    };
    container.classService.updateClassVoice(chan.name, classVoiceObj);
  },
} satisfies Command;

const createEmbed = (): discord.MessageEmbed => {
  return new discord.MessageEmbed()
    .setTitle('🎙 Voice Channel Created 🎙')
    .setDescription('Click the button below to gain acces to the voice channel');
};
