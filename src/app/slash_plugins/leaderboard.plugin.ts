import { CommandInteraction, User } from 'discord.js';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';
import { GameType } from '../../services/gameleaderboard.service';

async function createOpponentPlayerEmbed(
  container: IContainer,
  interaction: CommandInteraction,
  opponent: User,
  gameEnum: GameType
) {
  return container.gameLeaderboardService.createMatchupLeaderboardEmbed(
    interaction.user,
    opponent,
    gameEnum
  );
}

async function getMatchUpEmbed(
  container: IContainer,
  playerOne: User,
  playerTwo: User,
  gameEnum: GameType
) {
  return container.gameLeaderboardService.createMatchupLeaderboardEmbed(
    playerOne,
    playerTwo,
    gameEnum
  );
}

type GameTypeString = keyof typeof GameType;

export default {
  name: 'leaderboard',
  commandName: 'leaderboard',
  description: 'Gets the leaderboards of games',
  options: [
    {
      type: 'STRING',
      name: 'game',
      description: 'The game to get the leaderboard for',
      required: true,
      choices: Object.keys(GameType)
        .filter((key) => Number.isNaN(Number(key)))
        .map((game) => ({ name: game, value: game })),
    },
    {
      type: 'USER',
      name: 'opponent1',
      description: 'The first opponent to get the leaderboard for',
    },
    {
      type: 'USER',
      name: 'opponent2',
      description: 'The second opponent to get the leaderboard for',
    },
  ],
  async execute({ interaction, container }) {
    await interaction.deferReply();

    const game = interaction.options.getString('game', true) as GameTypeString;
    const opponent1 = interaction.options.getUser('opponent1');
    const opponent2 = interaction.options.getUser('opponent2');
    const gameEnum = GameType[game];

    // Get default leaderboard if no users are given
    if (!opponent1) {
      const embed = await container.gameLeaderboardService.createOverallLeaderboardEmbed(
        interaction.user,
        gameEnum
      );

      if (typeof embed === 'string') {
        await interaction.followUp(embed);
        return;
      }

      await interaction.followUp({ embeds: [embed] });
      return;
    }

    // Give one players leaderboard if no opponent is given
    if (!opponent2) {
      const embed = await createOpponentPlayerEmbed(container, interaction, opponent1, gameEnum);

      if (typeof embed === 'string') {
        await interaction.followUp(embed);
        return;
      }

      await interaction.followUp({ embeds: [embed] });
      return;
    }

    const embed = await getMatchUpEmbed(container, opponent1, opponent2, gameEnum);

    if (typeof embed === 'string') {
      await interaction.followUp(embed);
      return;
    }

    await interaction.followUp({ embeds: [embed] });
  },
} satisfies Command;
