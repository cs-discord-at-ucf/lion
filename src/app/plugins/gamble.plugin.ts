import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { PointsDocument, PointsModel } from '../../schemas/points.schema';

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
    const userDoc: Maybe<PointsDocument> = await PointsModel.findOne({
      userID: message.author.id,
      guildID: this.container.guildService.get().id,
    });

    if (!userDoc) {
      PointsModel.create({
        userID: message.author.id,
        guildID: this.container.guildService.get().id,
        numPoints: 0,
      });

      message.reply('You have no points to gamble!');
      return;
    }

    if (userDoc.numPoints === 0) {
      message.reply('You have no points to gamble!');
      return;
    }

    if (args[0] === 'all') {
      message.reply({
        embeds: [await this._gamble(message.author.id, userDoc.numPoints, userDoc.numPoints)],
      });
      return;
    }

    // Try to gamble the number given by user
    message.reply({
      embeds: [await this._gamble(message.author.id, userDoc.numPoints, parseInt(args[0]))],
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
    const newPoints = userWon ? totalPoints + betAmount : totalPoints - betAmount;

    await PointsModel.updateOne(
      {
        userID: userID,
        guildID: this.container.guildService.get().id,
      },
      { $set: { numPoints: newPoints } }
    );

    return this._createResultEmbed(betAmount, userWon, newPoints);
  }

  private _createResultEmbed(
    betAmount: number,
    userWon: boolean,
    newPoints: number
  ): MessageEmbed | PromiseLike<MessageEmbed> {
    const resultString = (userWon: boolean): string => {
      if (userWon) {
        return ':confetti_ball: You won! :confetti_ball:';
      }

      return ':sadge: You lost! :sadge:';
    };

    const embed = new MessageEmbed();

    embed.setTitle(resultString(userWon));
    embed.setDescription(
      `You bet **${betAmount}** and *${userWon ? 'won' : 'lost'}!*\n` +
        `You now have **${newPoints}** points`
    );

    if (userWon) {
      embed.setColor('#a3be8c');
    } else {
      embed.setColor('#bf616a');
    }

    return embed;
  }

  private _createInvalidBetEmbed(totalPoints: number, betAmount: number): MessageEmbed {
    const embed = new MessageEmbed();

    embed.setTitle('You do not have enough points');
    embed.setDescription(`You have **${totalPoints}** points\nYou tried to bet **${betAmount}**`);

    return embed;
  }
}
