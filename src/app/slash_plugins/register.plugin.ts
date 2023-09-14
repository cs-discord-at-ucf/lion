import { CommandInteraction, GuildMember, MessageEmbed, User } from 'discord.js';
import Constants from '../../common/constants';
import { ISlashCommand } from '../../common/slash';
import { ClassType, IContainer, IInteractionEmbedData } from '../../common/types';

const maxAllowedClasses = 10;

async function attemptAddClass(
  container: IContainer,
  className: string,
  user: User
): Promise<string> {
  const request = container.classService.buildRequest(user, [className]);
  if (!request) {
    container.loggerService.warn(
      `Error building request: ${JSON.stringify({ user: user.id, className: className })}`
    );
    return 'Error building request';
  }
  try {
    const response = await container.classService.register(request);
    if (response.includes('success')) {
      return 'success';
    } else {
      return 'invalid';
    }
  } catch (e) {
    container.loggerService.error(`register plugin ${e}`);
  }

  return 'success';
}

async function giveResultsToUser(
  container: IContainer,
  results: string[],
  args: string[],
  interaction: CommandInteraction
) {
  const validClasses: string[] = [];
  const invalidClasses: string[] = [];

  // Parse what worked and what did not
  results.forEach((r, i) => {
    if (r === 'success') {
      validClasses.push(args[i]);
    }
    if (r === 'invalid') {
      invalidClasses.push(args[i]);
    }
  });

  const embedAuthorData = container.messageService.getEmbedAuthorData(interaction);
  const shouldShowAuthorOnRegister = true;

  if (validClasses.length > 0) {
    // List of channel links, one per line
    const validChannels = validClasses
      .map((validClass) => {
        return container.classService.findClassByName(validClass);
      })
      .join('\n');

    const embed = new MessageEmbed()
      .setTitle('Successfully registered')
      .setDescription(validChannels)
      .setColor('#a3be8c');
    if (shouldShowAuthorOnRegister) {
      embed.setAuthor(embedAuthorData);
    }

    await interaction.followUp({
      embeds: [embed],
    });
    return;
  }

  if (container.classService.getClasses(ClassType.ALL).size === 0) {
    await interaction.followUp('No classes found at this time.');
    return;
  }

  const embedMessages: IInteractionEmbedData[] = container.classService.getSimilarClasses(
    interaction,
    invalidClasses,
    'register'
  );

  // Ships it off to the message Service to manage sending the message and its lifespan
  await Promise.all(
    embedMessages.map((embedData) => {
      const cutoffEmbed = new MessageEmbed()
        .setTitle('Successfully registered')
        .setDescription(String(embedData.emojiData[0].args.classChan) || 'N/A')
        .setColor('#a3be8c');
      const closingEmbed = new MessageEmbed()
        .setTitle('Closed registering offer')
        .setDescription(String(embedData.emojiData[0].args.classChan) || 'N/A')
        .setColor('#bf616a');
      if (shouldShowAuthorOnRegister) {
        cutoffEmbed.setAuthor(embedAuthorData);
        closingEmbed.setAuthor(embedAuthorData);
      }

      return container.messageService.sendReactiveMessage(
        interaction,
        embedData,
        container.classService.addClass,
        {
          reactionCutoff: 1,
          cutoffMessage: {
            embeds: [cutoffEmbed],
          },
          closingMessage: {
            embeds: [closingEmbed],
          },
        }
      );
    })
  );
}

export default {
  name: 'register',
  commandName: 'register',
  description: 'Allows for you to register classes.',
  options: [
    {
      name: 'class_name',
      description: 'The class name to register for. Use "all" to register for all classes.',
      type: 'STRING',
      required: true,
      autocomplete: true,
    },
    ...Array.from(
      { length: maxAllowedClasses - 1 },
      (_, i) =>
        ({
          name: `class_name_${i + 1}`,
          description: 'The class name to register for.',
          type: 'STRING',
          required: false,
          autocomplete: true,
        } as const)
    ),
  ],

  async autocomplete({ interaction, container }) {
    const focusedOption = interaction.options.getFocused();
    const similiarClasses = container.classService.findSimilarClasses(focusedOption);

    await interaction.respond(similiarClasses.map((c) => ({ name: c, value: c })).slice(0, 25));
  },

  async execute({ interaction, container }) {
    await interaction.deferReply();
    const requestedClasses: string[] = [
      interaction.options.getString('class_name', true).toLowerCase(),
      ...(Array.from({ length: maxAllowedClasses - 1 }, (_, i) =>
        interaction.options.getString(`class_name_${i + 1}`)?.toLowerCase()
      ).filter((c) => !!c) as string[]),
    ];

    const registeredClasses = Array.from(
      container.classService.getClasses(ClassType.ALL).values()
    ).filter((chan) => container.classService.userIsRegistered(chan, interaction.user));

    if (!interaction.member) {
      return;
    }

    const isModerator = container.userService.hasRole(
      interaction.member as GuildMember,
      Constants.Roles.Moderator
    );

    // Check if non-mod registers all.
    if (requestedClasses[0] === 'all' && !isModerator) {
      await interaction.followUp('You must be a `Moderator` to register for all classes.');
      return;
    }

    if (!isModerator && registeredClasses.length + 1 > maxAllowedClasses) {
      await interaction.followUp(
        `Sorry, you can only register for ${maxAllowedClasses} classes in total.`
      );
      return;
    }

    const results: string[] = await Promise.all(
      requestedClasses.map((arg) => attemptAddClass(container, arg, interaction.user))
    );

    await giveResultsToUser(container, results, requestedClasses, interaction);
  },
} satisfies ISlashCommand;
