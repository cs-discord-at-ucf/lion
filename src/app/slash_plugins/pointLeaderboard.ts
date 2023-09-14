import { MessageEmbed } from 'discord.js';
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

    const convertIUserPointToString = async (userPoints: IUserPoints) => {
      const user = await container.clientService.users.fetch(userPoints.userID);
      return `${user ?? userPoints.userID}: ${userPoints.numPoints}`;
    };

    const embed = new MessageEmbed()
      .setTitle(':taco: Top Tacos :taco:')
      .addField('You', `${userRank}. ${await convertIUserPointToString(userDoc as IUserPoints)}`)
      .addField(
        'Leaderboard',
        (
          await Promise.all(
            topPoints.map(
              async (userPoints: IUserPoints, i: number) =>
                `${i + 1}. ${await convertIUserPointToString(userPoints)}`
            )
          )
        ).join('\n')
      )
      .addField(
        'Last Place',
        `${await convertIUserPointToString(await container.pointService.getLastPlace())}`
      )
      .setTimestamp(Date.now());

    await interaction.followUp({ embeds: [embed] });
  },
} satisfies ISlashCommand;
