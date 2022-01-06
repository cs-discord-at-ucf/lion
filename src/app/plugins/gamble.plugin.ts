import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class GamblePlugin extends Plugin {
  public commandName: string = 'gamble';
  public name: string = 'Gamble Plugin';
  public description: string = 'Bet your points on a coin flip';
  public usage: string = 'gamble 100\ngamble all';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.All;

  public override commandPattern: RegExp = /(all|\d+)/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const userDoc = await this.container.pointService.getUserPointDoc(message.author.id);

    if (userDoc.numPoints === 0) {
      message.reply('You have no points to gamble!');
      return;
    }

    // Try to gamble the number given by user
    const pointsToGamble = args[0].toLowerCase() === 'all' ? userDoc.numPoints : parseInt(args[0]);

    message.reply({
      embeds: [await this._gamble(message.author.id, userDoc.numPoints, pointsToGamble)],
    });
  }

  private async _gamble(
    userID: string,
    totalPoints: number,
    betAmount: number
  ): Promise<MessageEmbed> {
    if (betAmount > totalPoints) {
      return this._createInvalidBetEmbed(totalPoints, betAmount);
    }

    const userWon: boolean = Math.random() < 0.5;
    const newPoints = totalPoints + (userWon ? betAmount : -betAmount);

    await this.container.pointService.awardPoints(userID, userWon ? betAmount : -betAmount);
    return this._createResultEmbed(betAmount, userWon, newPoints);
  }

  private _createResultEmbed(
    betAmount: number,
    userWon: boolean,
    newPoints: number
  ): MessageEmbed | PromiseLike<MessageEmbed> {
    const resultString = (userWon: boolean): string =>
      userWon ? ':confetti_ball: You won! :confetti_ball:' : ':sadge: You lost! :sadge:';

    return new MessageEmbed()
      .setTitle(resultString(userWon))
      .setDescription(
        `You bet **${betAmount}** and *${userWon ? 'won' : 'lost'}!*\n` +
          `You now have **${newPoints}** points`
      )
      .setColor(userWon ? '#a3be8c' : '#bf616a');
  }

  private _createInvalidBetEmbed(totalPoints: number, betAmount: number): MessageEmbed {
    return new MessageEmbed()
      .setTitle('You do not have enough points')
      .setDescription(`You have **${totalPoints}** points\nYou tried to bet **${betAmount}**`);
  }
}
