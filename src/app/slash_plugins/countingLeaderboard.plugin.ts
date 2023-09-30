import { Formatters, MessageEmbed } from 'discord.js';
import { Command } from '../../common/slash';
import { ICountingEntry } from '../../common/types';
import { CountingLeaderboardModel } from '../../schemas/games.schema';

const DISPLAY_AMOUNT = 15;

const plugin = {
  commandName: 'countingleaderboard',
  name: 'Counting Leaderboard',
  description: 'Displays the top posters in #counting',
  async execute({ interaction, container }) {
    const docs = (await CountingLeaderboardModel.find({ guildId: container.guildService.get().id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, DISPLAY_AMOUNT);

    const ranked = docs.map(
      (userDoc: ICountingEntry, i: number) => `${i + 1}. ${convertICountingEntryToString(userDoc)}`
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

const convertICountingEntryToString = (userPoints: ICountingEntry) => {
  return `${Formatters.userMention(userPoints.userId)}: ${userPoints.count}`;
};

export default plugin;
