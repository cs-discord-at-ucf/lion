import { MessageEmbed, Formatters } from 'discord.js';
import { ISlashCommand } from '../../common/slash';
import { IUserPoints } from '../../common/types';

export default {
  name: 'tacoleaderboard',
  commandName: 'tacoleaderboard',
  description: 'Gets the people with the most Tacos',
  async execute({ interaction, container }) {
    await interaction.deferReply();

    const [userDoc, userRank, topPoints] = await Promise.all([
      container.pointService.getUserPointDoc(interaction.user.id),
      container.pointService.getUserRank(interaction.user.id),
      container.pointService.getTopPoints(15),
    ]);

    const convertIUserPointToString = (userPoints: IUserPoints) => {
      return `${Formatters.userMention(userPoints.userID)}: ${userPoints.numPoints}`;
    };

    const embed = new MessageEmbed()
      .setTitle(':taco: Top Tacos :taco:')
      .addField('You', `${userRank}. ${convertIUserPointToString(userDoc as IUserPoints)}`)
      .addField(
        'Leaderboard',
        topPoints
          .map(
            (userPoints: IUserPoints, i: number) =>
              `${i + 1}. ${convertIUserPointToString(userPoints)}`
          )
          .join('\n')
      )
      .addField(
        'Last Place',
        `${convertIUserPointToString(await container.pointService.getLastPlace())}`
      )
      .setTimestamp(Date.now());

    await interaction.followUp({ embeds: [embed] });
  },
} satisfies ISlashCommand;
