import { Command } from '../../common/slash';

const activityTypes = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'] as const;
type ActivityType = (typeof activityTypes)[number];

export default {
  name: 'lionpresence',
  commandName: 'lionpresence',
  description: 'A plugin that sets the presence of the lion bot.',
  defaultMemberPermissions: ['ADMINISTRATOR'],
  options: [
    {
      name: 'activity_type',
      description: 'The type of activity to set.',
      type: 'STRING',
      required: true,
      choices: activityTypes.map((type) => ({ name: type, value: type })),
    },
    {
      name: 'message',
      description: 'The message to set the activity to.',
      type: 'STRING',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const type = interaction.options.getString('activity_type', true) as ActivityType;
    const activity = interaction.options.getString('message', true);

    container.clientService.user?.setPresence({
      activities: [{ name: activity, type: type }],
      status: 'online',
    });

    await interaction.reply('Activity set!');
  },
} satisfies Command;
