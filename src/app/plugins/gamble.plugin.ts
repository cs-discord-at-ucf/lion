import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class GamblePlugin extends Plugin {
  public commandName: string = 'gamble';
  public name: string = 'Gamble Plugin';
  public description: string = 'Bet your Tacos on a coin flip';
  public usage: string = 'gamble 100\ngamble all';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public override pluginChannelName: string = Constants.Channels.Public.Games;

  public override commandPattern: RegExp = /(all|\d+)/;

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]): boolean {
    if (args.length !== 2) {
      return false;
    }

    return message.mentions.users.size === 1 && this.commandPattern.test(args[1]);
  }

  public async execute(message: IMessage, args: string[]) {
    const userDoc = await this.container.pointService.getUserPointDoc(message.author.id);

    if (userDoc.numPoints === 0) {
      message.reply('You have no Tacos to gamble!');
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
    if (betAmount > totalPoints || betAmount < this._minBet) {
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
  }

  private _createInvalidBetEmbed(totalPoints: number, betAmount: number): MessageEmbed {
    return new MessageEmbed()
      .setTitle('That was an invalid bet amount')
      .setDescription(`You have **${totalPoints}** Tacos\nYou tried to bet **${betAmount}**`)
      .setFooter(`There is a minimum bet of ${this._minBet}`)
      .setColor('#bf616a');
  }
}
