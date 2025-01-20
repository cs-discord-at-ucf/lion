import { CommandInteraction } from 'discord.js';
import levenshtein from 'js-levenshtein';
import { Command } from '../../common/slash';
import { ClassType, IContainer, IInteractionEmbedData } from '../../common/types';

const maxClasses = 10;

async function removeFromAllClasses(container: IContainer, interaction: CommandInteraction) {
  const request = container.classService.buildRequest(interaction.user, ['all']);
  if (!request) {
    await interaction.followUp({ content: 'Unable to complete your request.', ephemeral: true });
    return;
  }

  const response = await container.classService.unregister(request);
  await interaction.followUp({ content: response });
}

export default {
  name: 'unregister',
  commandName: 'unregister',
  description: 'Allows for you to unregister classes.',
  options: [
    {
      name: 'class',
      description: 'The class to unregister from.',
      type: 'STRING',
      required: true,
      autocomplete: true,
    },
    ...Array.from({ length: maxClasses - 1 }).map(
      (_, i) =>
        ({
          name: `class${i + 1}`,
          description: 'Another class to unregister from.',
          type: 'STRING',
          required: false,
          autocomplete: true,
        } as const)
    ),
  ],

  async autocomplete({ interaction, container }) {
    const focused = interaction.options.getFocused();

    const registeredClasses = [...container.classService.getClasses(ClassType.ALL).values()]
      .filter((c) => container.classService.userIsRegistered(c, interaction.user))
      .sort((a, b) => levenshtein(a.name, focused) - levenshtein(b.name, focused));

    await interaction.respond(
      registeredClasses.map((c) => ({ name: c.name, value: c.name })).slice(0, 25)
    );
  },

  async execute({ interaction, container }) {
    await interaction.deferReply();

    const allClasses = [
      interaction.options.getString('class', true),
      ...Array.from({ length: maxClasses })
        .map((_, i) => interaction.options.getString(`class${i + 1}`))
        .filter((c): c is string => !!c),
    ];

    const firstClass = allClasses[0];
    if (firstClass.toLowerCase() === 'all') {
      await removeFromAllClasses(container, interaction);
      return;
    }

    let numSuccessfulClasses = 0;
    const invalidClasses: string[] = [];

    for (const className of allClasses) {
      const request = container.classService.buildRequest(interaction.user, [className]);
      if (!request) {
        invalidClasses.push(className);
        continue;
      }

      try {
        const response = await container.classService.unregister(request);
        if (response.includes('success')) {
          numSuccessfulClasses++;
        } else {
          invalidClasses.push(className);
        }
      } catch (e) {
        container.loggerService.error(`class unregister plugin ${e}`);
      }
    }

    if (numSuccessfulClasses !== 0) {
      await interaction.followUp({
        content: `Successfully removed from ${numSuccessfulClasses} classes`,
      });
    }

    if (invalidClasses.length <= 0) {
      return;
    }

    if (container.classService.getClasses(ClassType.ALL).size === 0) {
      await interaction.followUp({
        content: 'No classes found at this time.',
      });
      return;
    }

    const embedMessages: IInteractionEmbedData[] = container.classService.getSimilarClasses(
      interaction,
      invalidClasses,
      'unregister'
    );

    // Ships it off to the message Service to manage sending the message and its lifespan
    await Promise.all(
      embedMessages.map((embedData) => {
        return container.messageService.sendReactiveMessage(
          interaction,
          embedData,
          container.classService.removeClass,
          {
            reactionCutoff: 1,
            cutoffMessage: `Successfully unregistered from ${
              embedData.emojiData[0].args.classChan || 'N/A'
            }.`,
            closingMessage: {
              content: `Closed unregistering offer to ${
                embedData.emojiData[0].args.classChan || 'N/A'
              }.`,
            },
          }
        );
      })
    );
  },
} satisfies Command;
