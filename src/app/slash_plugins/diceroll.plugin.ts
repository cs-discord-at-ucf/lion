import { ISlashCommand } from '../../common/slash';

export default {
  commandName: 'dice',
  name: 'dice',
  description: 'Roll a die, defaults to a 6-sided die.',
  options: [
    {
      name: 'number',
      description: 'The upper bound of the die roll',
      type: 'INTEGER',
    },
  ],
  async execute({ interaction }) {
    const upperBound = interaction.options.getInteger('number') ?? 6;
    const randomNumber = Math.ceil(Math.random() * upperBound);

    await interaction.reply(`You rolled a \`${randomNumber}\``);
  },
} satisfies ISlashCommand;
