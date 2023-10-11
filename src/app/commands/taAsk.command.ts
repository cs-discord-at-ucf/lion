import { CommandInteraction, GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import mongoose from 'mongoose';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';
import { ClassTAModel, ITAEntry } from '../../schemas/class.schema';

export default {
  name: 'TA Ask Plugin',
  commandName: 'taask',
  description: 'Allows TAs to register for classes.',
  options: [
    { type: 'STRING', name: 'question', description: 'The question to ask', required: true },
  ],
  async execute({ interaction, container }) {
    const channel = interaction.channel!.isThread()
      ? (interaction.channel.parent as TextChannel)
      : (interaction.channel as TextChannel);

    const isClassChan = container.classService.isClassChannel(channel.name);
    if (!isClassChan) {
      await interaction.reply({
        content: 'Please use this command in a class channel',
        ephemeral: true,
      });
      return;
    }

    await handleAsk(interaction, container);
  },
} satisfies Command;

const handleAsk = async (interaction: CommandInteraction, container: IContainer) => {
  const question = interaction.options.getString('question', true);

  const channel = interaction.channel!.isThread()
    ? interaction.channel.parent
    : interaction.channel;
  const TAs: GuildMember[] = await getTAs(interaction, container, channel as TextChannel);
  if (!TAs.length) {
    await interaction.reply('There are no TAs registered for this class');
    return;
  }

  const mentions = TAs.map((m) => m.user.toString()).join(' ');
  const embed: MessageEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
    .setDescription(`${question}`)
    .setTimestamp();

  await interaction.reply({ content: mentions, embeds: [embed] });
};

const getTAs = async (
  interaction: CommandInteraction,
  container: IContainer,
  chan: TextChannel
): Promise<GuildMember[]> => {
  if (!mongoose.connection.readyState) {
    await interaction.reply({ content: 'Error connecting to the DB', ephemeral: true });
    return [];
  }

  const fromCollection = (
    await ClassTAModel.find({
      guildID: chan.guild.id,
    })
  ).filter((e) => e.chanID === chan.id);

  // Make sure the members are cached before lookup
  await container.guildService.get().members.fetch();
  return fromCollection.reduce((acc: GuildMember[], entry: ITAEntry) => {
    const member = container.guildService.get().members.cache.get(entry.userID);
    if (member) {
      acc.push(member);
    }

    return acc;
  }, []);
};
