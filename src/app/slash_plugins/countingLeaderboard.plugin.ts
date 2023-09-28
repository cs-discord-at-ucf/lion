import { MessageEmbed } from 'discord.js';
import { Command } from '../../common/slash';
import { IContainer, ICountingEntry } from '../../common/types';
import { CountingLeaderboardModel } from '../../schemas/games.schema';

const DISPLAY_AMOUNT = 15;

const plugin = {
  commandName: 'countingLeaderboard',
  name: 'Counting Leaderboard',
  description: 'Displays the top posters in #counting',
  async execute({ interaction, container }) {
    const docs = (await CountingLeaderboardModel.find({ guildId: container.guildService.get().id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, DISPLAY_AMOUNT);

    const ranked = await Promise.all(
      docs.map(
        async (userDoc: ICountingEntry, i: number) =>
          `${i + 1}. ${await convertICountingEntryToString(container, userDoc)}`
      )
    );

    await interaction.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(this.name)
          .addField('Leaderboard', ranked.join('\n'))
          .setTimestamp(Date.now()),
      ],
    });
  },
} satisfies Command;

const convertICountingEntryToString = async (container: IContainer, userPoints: ICountingEntry) => {
  const user = await container.clientService.users.fetch(userPoints.userId);
  return `${user ?? userPoints.userId}: ${userPoints.count}`;
};

export default plugin;
