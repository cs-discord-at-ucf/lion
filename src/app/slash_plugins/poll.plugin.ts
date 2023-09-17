import { Message } from 'discord.js';
import { ISlashCommand } from '../../common/slash';
import ms from 'ms';

const maxDuration = 480;

class PollState {
  private readonly _counts = new Map<string, number>();
  private readonly _voted = new Map<string, string>();

  constructor(options: readonly string[]) {
    this._counts = options.reduce((map, option) => map.set(option, 0), new Map<string, number>());
  }

  public vote(userId: string, option: string) {
    if (!this._counts.has(option)) {
      throw new Error(`Invalid option: ${option}`);
    }

    this._counts.set(option, this._counts.get(option)! + 1);
    this._voted.set(userId, option);
  }

  public getVote(userId: string) {
    return this._voted.get(userId);
  }

  public get counts() {
    return [...this._counts.entries()].sort(([, a], [, b]) => b - a);
  }
}

function createVoteCountEmbed(counts: [string, number][]) {
  const embed = {
    title: 'Poll Results',
    description: counts
      .map(([option, count], i) => `**${i + 1}.** \`${option}\` - ${count}`)
      .join('\n'),
  } as const;

  return embed;
}

export default {
  commandName: 'poll',
  name: 'Poll',
  description: 'Creates an interaction poll.',
  options: [
    {
      name: 'title',
      description: 'The title of the poll.',
      type: 'STRING',
      required: true,
    },
    {
      name: 'time',
      description: `The time (in minutes) the poll will last. (maximum of ${maxDuration} minutes)`,
      type: 'INTEGER',
      required: true,
    },
    ...Array.from(
      { length: 10 },
      (_, i) =>
        ({
          name: `option${i + 1}`,
          description: `Option ${i + 1} of the poll.`,
          type: 'STRING',
          required: i < 2,
        } as const)
    ),
  ],
  async execute({ interaction }) {
    const choices = Array.from({ length: 10 }, (_, i) =>
      interaction.options.getString(`option${i + 1}`)
    ).filter(Boolean) as string[];

    const time = interaction.options.getInteger('time', true);

    if (time === 0 || time > maxDuration) {
      await interaction.reply({
        content: `The time must be between 1 and ${maxDuration} minutes.`,
        ephemeral: true,
      });
      return;
    }

    const selectMenu = {
      type: 'SELECT_MENU',
      customId: 'pollSelector',
      maxValues: 1,
      placeholder: 'Vote for an option',
      options: choices.map((choice) => ({ label: choice, value: choice })),
    } as const;

    const pollState = new PollState(choices);

    const message = (await interaction.reply({
      content: `### Poll for "${interaction.options.getString('title')}"`,
      embeds: [createVoteCountEmbed(pollState.counts)],
      components: [
        {
          type: 'ACTION_ROW',
          components: [selectMenu],
        },
      ],
      fetchReply: true,
    })) as Message;

    const collector = message.createMessageComponentCollector({
      componentType: 'SELECT_MENU',
      time: ms('1m') * time,
    });

    collector.on('collect', async (selectInteraction) => {
      const { user } = selectInteraction;

      const vote = pollState.getVote(user.id);

      if (vote) {
        await selectInteraction.reply({
          content: `You have already voted for \`${vote}\`!`,
          ephemeral: true,
        });
        return;
      }

      const [choice] = selectInteraction.values;
      pollState.vote(user.id, choice);

      await selectInteraction.update({
        embeds: [createVoteCountEmbed(pollState.counts)],
      });
    });

    collector.on('end', async () => {
      await Promise.all([
        message.edit({ components: [] }),
        message.reply({
          content: `### Poll for  "${interaction.options.getString(
            'title',
            true
          )}" ended! Here are the results!`,
          embeds: [createVoteCountEmbed(pollState.counts)],
        }),
      ]);
    });
  },
} satisfies ISlashCommand;
