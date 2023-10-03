import { MessageEmbed } from 'discord.js';
import { Command } from '../../common/slash';

const command = {
  commandName: 'points',
  name: 'Points Plugin',
  description: 'Displays your current points',
  async execute({ interaction, container }) {
    const userDoc = await container.pointService.getUserPointDoc(interaction.user.id);
    const embed = new MessageEmbed()
      .setTitle(`:taco: ${interaction.user.username ?? 'Null'}'s Tacos :taco:`)
      .setDescription(`You have **${userDoc.numPoints}** Tacos`)
      .setFooter('You can gamble with your Tacos with /gamble');

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;

export default command;
