import { CommandInteraction } from 'discord.js';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

const newRepOptions = [
  {
    type: 'USER',
    name: 'user',
    description: 'The user to report',
    required: true,
  } as const,
  {
    type: 'STRING',
    name: 'description',
    description: 'The description of the report',
    required: true,
  } as const,
  {
    type: 'ATTACHMENT',
    name: 'screenshot',
    description: 'A screenshot of the report',
    required: false,
  } as const,
];

export default {
  commandName: 'modreport',
  name: 'Mod Report',
  description: 'Report a user',
  defaultMemberPermissions: ['MODERATE_MEMBERS'],
  options: [
    {
      type: 'SUB_COMMAND',
      name: 'add',
      description: 'Add a report to a user',
      options: newRepOptions,
    },
    {
      type: 'SUB_COMMAND',
      name: 'warn',
      description: 'Warn a user',
      options: newRepOptions,
    },
    {
      type: 'SUB_COMMAND',
      name: 'list',
      description: 'Get a summary of a user',
      options: [
        {
          type: 'USER',
          name: 'user',
          description: 'The user to get a summary of',
          required: true,
        },
        {
          type: 'BOOLEAN',
          name: 'full',
          description: 'Get a full report',
          required: false,
        },
      ],
    },
    {
      type: 'SUB_COMMAND',
      name: 'ban',
      description: 'Ban a user',
      options: [
        {
          type: 'USER',
          name: 'user',
          description: 'The user to ban',
          required: true,
        },
        {
          type: 'STRING',
          name: 'description',
          description: 'The description of the report',
          required: false,
        },
      ],
    },
  ],
  async execute({ interaction, container }) {
    const subCommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    if (!user) {
      await interaction.reply('Could not find user with that handle');
      return;
    }

    // Standardize all forms indentification to an ID
    const { id } = user;

    await interaction.deferReply();

    try {
      if (subCommand === 'add') {
        await handleAddReport(container, interaction, id);
        return;
      }

      if (subCommand === 'warn') {
        await handleIssueWarning(container, interaction, id);
        return;
      }

      if (subCommand === 'ban') {
        await handleIssueBan(container, interaction, id);
        return;
      }

      if (subCommand === 'list') {
        const isFull = interaction.options.getBoolean('full') ?? false;

        if (isFull) {
          await handleFullList(container, interaction, id);
        } else {
          await interaction.followUp({ embeds: [await generateListReport(container, id)] });
        }
      }
    } catch (e) {
      await interaction.followUp('Something went wrong. Did you put the username correctly?');
      container.loggerService.error(`modreport execute ${e}`);
    }
  },
} satisfies Command;

const createReport = (container: IContainer, interaction: CommandInteraction, id: string) => {
  const description = interaction.options.getString('description') ?? 'no description';
  const attachment = interaction.options.getAttachment('screenshot');

  if (attachment) {
    return new Moderation.Report(container.guildService.get(), id, description, [attachment.url]);
  }

  return new Moderation.Report(container.guildService.get(), id, description);
};

const handleAddReport = async (
  container: IContainer,
  interaction: CommandInteraction,
  id: string
) => {
  const rep = createReport(container, interaction, id);

  await interaction.followUp({
    content: await container.modService.fileReport(rep),
    embeds: [await generateListReport(container, id)],
  });
};

const generateListReport = (container: IContainer, id: string) => {
  return container.modService.getModerationSummary(container.guildService.get(), id);
};

const handleFullList = async (
  container: IContainer,
  interaction: CommandInteraction,
  id: string
) => {
  const member = await Moderation.Helpers.resolveUser(container.guildService.get(), id);
  if (!member) {
    await interaction.followUp('Could not get member');
    return;
  }

  try {
    await interaction.followUp({
      content: `Full Report for ${member.user.username}`,
      files: [await container.modService.getFullReport(container.guildService.get(), id)],
    });
  } catch (e) {
    await interaction.followUp(`Error getting report: ${e}`);
  }
};

const handleIssueWarning = async (
  container: IContainer,
  interaction: CommandInteraction,
  id: string
) => {
  const rep = createReport(container, interaction, id);

  await interaction.followUp({
    content: await container.modService.fileWarning(rep),
    embeds: [await generateListReport(container, id)],
  });
};

const handleIssueBan = async (
  container: IContainer,
  interaction: CommandInteraction,
  id: string
) => {
  const rep = createReport(container, interaction, id);

  interaction.followUp(await container.modService.fileBan(rep, true));
};
