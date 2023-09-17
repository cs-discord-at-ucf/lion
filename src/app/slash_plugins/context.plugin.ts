import { Command } from '../../common/slash';

export default {
  type: 'MESSAGE',
  name: 'echo',
  commandName: 'echo',
  async execute({ interaction }) {
    await interaction.reply({ content: interaction.targetMessage.content });
  },
} satisfies Command;
