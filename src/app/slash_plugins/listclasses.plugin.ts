import { Message } from 'discord.js';
import ms from 'ms';
import { ISlashCommand } from '../../common/slash';
import { ClassType } from '../../common/types';

export default {
  name: 'listclasses',
  commandName: 'listclasses',
  description: 'Returns the current class channels on the server.',
  options: [
    {
      name: 'class_type',
      description: 'The class type to filter by.',
      type: 'STRING',
      choices: Object.values(ClassType).map((c) => ({ name: c, value: c })),
    },
  ],
  async execute({ interaction, container }) {
    if (container.classService.getClasses(ClassType.ALL).size === 0) {
      await interaction.reply('No classes found at this time.');
      return;
    }

    const filterName = interaction.options.getString('class_type')?.toUpperCase() ?? ClassType.ALL;

    if (filterName === ClassType.ALL) {
      const message = (await interaction.reply({
        content: 'Select classes based on category:',
        components: [
          {
            type: 'ACTION_ROW',
            components: [
              {
                type: 'SELECT_MENU',
                customId: 'class_type',
                placeholder: 'Select a class type',
                options: [
                  {
                    label: 'IT - Information Technology',
                    value: ClassType.IT,
                  },
                  {
                    label: 'CS - Computer Science',
                    value: ClassType.CS,
                  },
                  {
                    label: 'CSGRAD - Computer Science Graduate',
                    value: ClassType.CSGRAD,
                  },
                  {
                    label: 'EE - Electrical Engineering',
                    value: ClassType.EE,
                  },
                  {
                    label: 'EEGRAD - Electrical Engineering Graduate',
                    value: ClassType.EEGRAD,
                  },
                  {
                    label: 'GENED - General Education',
                    value: ClassType.GENED,
                  },
                ],
              },
            ],
          },
        ],
        fetchReply: true,
        ephemeral: true,
      })) as Message;

      const collector = message.createMessageComponentCollector({
        componentType: 'SELECT_MENU',
        time: ms('2m'), // Listen for 2 Minutes
      });

      collector.on('collect', async (menuInteraction) => {
        if (menuInteraction.customId === 'class_type') {
          const filterName = menuInteraction.values[0];
          const filter = container.classService.resolveClassType(filterName);

          if (!filter) {
            response.push('\n**The filter supplied is invalid; everything is listed above.**');
          }

          await menuInteraction.update({
            content: container.classService.buildClassListText(filterName).join('\n'),
          });
        }
      });

      return;
    }

    const response = container.classService.buildClassListText(filterName);

    await interaction.reply({
      content: response.join('\n'),
      ephemeral: true,
    });
  },
} satisfies ISlashCommand;
