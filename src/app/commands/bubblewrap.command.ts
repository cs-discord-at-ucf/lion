import { Command } from '../../common/slash';

const command = {
  commandName: 'bubblewrap',
  name: 'Bubble Wrap',
  description: 'Sends the user a sheet of bubble wrap to pop',
  async execute({ interaction }) {
    const wrap: string =
      'Here is some bubblewrap\n' + '||pop||||pop||||pop||||pop||||pop||\n'.repeat(5);
    await interaction.reply(wrap);
  },
} satisfies Command;

export default command;
