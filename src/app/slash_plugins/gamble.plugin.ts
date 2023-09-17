import { MessageEmbed } from 'discord.js';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';

const MIN_BET: number = 10;

const plugin: Command = {
  name: 'gamble',
  commandName: 'gamble',
  description: 'Bet your Tacos on a coin flip',
  options: [
    {
      name: 'amount',
      description: 'The amount of Tacos to gamble',
      type: 'STRING',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const arg = interaction.options.getString('amount');
    if (arg === null || !validateBetAmount(arg)) {
      await interaction.reply({ content: 'Invalid bet amount.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const userDoc = await container.pointService.getUserPointDoc(interaction.user.id);
    const pointsToGamble = arg.toLowerCase() === 'all' ? userDoc.numPoints : parseInt(arg);

    if (userDoc.numPoints === 0) {
      await interaction.followUp({ content: 'You have no Tacos to gamble!', ephemeral: true });
      return;
    }

    // Try to gamble the number given by user
    await interaction.followUp({
      embeds: [await gamble(interaction.user.id, userDoc.numPoints, pointsToGamble, container)],
    });
  },
};

const validateBetAmount = (arg: string): boolean => {
  if (arg.toLowerCase() === 'all') {
    return true;
  }

  const num = parseInt(arg);
  return !isNaN(num);
};

const gamble = async (
  userID: string,
  totalPoints: number,
  betAmount: number,
  container: IContainer
): Promise<MessageEmbed> => {
  if (betAmount > totalPoints || betAmount < MIN_BET) {
    return createInvalidBetEmbed(totalPoints, betAmount);
  }

  const userWon: boolean = Math.random() < 0.5;
  const newPoints = totalPoints + (userWon ? betAmount : -betAmount);

  await container.pointService.awardPoints(userID, userWon ? betAmount : -betAmount);
  return createResultEmbed(betAmount, userWon, newPoints);
};

const createResultEmbed = (
  betAmount: number,
  userWon: boolean,
  newPoints: number
): MessageEmbed => {
  const resultString = (userWon: boolean): string =>
    userWon
      ? ':confetti_ball: You won! :confetti_ball:'
      : ':no_entry_sign: You lost! :no_entry_sign:';

  return new MessageEmbed()
    .setTitle(resultString(userWon))
    .setDescription(
      `You bet **${betAmount}** and *${userWon ? 'won' : 'lost'}!*\n` +
        `:taco: You now have **${newPoints}** Tacos :taco:`
    )
    .setColor(userWon ? '#a3be8c' : '#bf616a');
};

const createInvalidBetEmbed = (totalPoints: number, betAmount: number): MessageEmbed => {
  return new MessageEmbed()
    .setTitle('That was an invalid bet amount')
    .setDescription(`You have **${totalPoints}** Tacos\nYou tried to bet **${betAmount}**`)
    .setFooter({
      text: `There is a minimum bet of ${MIN_BET}`,
    })
    .setColor('#bf616a');
};

export default plugin;
