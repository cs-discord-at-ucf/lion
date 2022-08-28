import { Guild, TextChannel } from 'discord.js';
import { IUserPoints, Maybe } from '../common/types';
import { PointsDocument, PointsModel } from '../schemas/points.schema';
import { GuildService } from './guild.service';
import Constants from '../common/constants';

export class PointService {
  private _guild: Guild;

  constructor(private _guildService: GuildService) {
    this._guild = this._guildService.get();
  }

  public async awardPoints(id: Maybe<string>, amount: number) {
    if (!id) {
      return;
    }

    // cache the #1 point holder before points are awarded
    const [kingBeforeAward] = await this.getTopPoints(1);

    const userDoc = await this.getUserPointDoc(id);
    await PointsModel.updateOne(userDoc, { $inc: { numPoints: amount } });

    const [kingAfterAward] = await this.getTopPoints(1);

    // the king has changed!
    if (kingBeforeAward.userID !== kingAfterAward.userID) {
      // remove the role from the previous king
      this._guild.members.cache.get(kingBeforeAward.userID)?.roles.remove(Constants.Roles.TacoKing);

      // give the role to the new king
      this._guild.members.cache.get(kingAfterAward.userID)?.roles.add(Constants.Roles.TacoKing);

      // get the games channel
      const gamesChan = this._guild.channels.cache.find(
        (c) => c.name === Constants.Channels.Public.Games
      );

      if (!gamesChan) {
        return;
      }

      (gamesChan as TextChannel).send(
        `${kingAfterAward.userID} stole the crown from ${kingBeforeAward.userID}. They are now the ${Constants.Roles.TacoKing}!`
      );
    }
  }

  public async getUserPointDoc(id: string): Promise<PointsDocument> {
    const storedDoc = await PointsModel.findOne({ userID: id, guildID: this._guild.id });
    if (!storedDoc) {
      return this.createUserPointDoc(id);
    }

    return storedDoc;
  }

  public createUserPointDoc(id: string): Promise<PointsDocument> {
    return PointsModel.create({ userID: id, guildID: this._guild.id, numPoints: 0 });
  }

  public async getTopPoints(maxEntries: number): Promise<IUserPoints[]> {
    const allPoints = await PointsModel.find({ guildID: this._guild.id });

    return allPoints
      .sort((a, b) => b.numPoints - a.numPoints)
      .slice(0, maxEntries)
      .map((doc) => doc as IUserPoints);
  }

  public async getUserRank(id: string) {
    return (
      (await PointsModel.find({ guildID: this._guild.id }))
        .sort((a, b) => b.numPoints - a.numPoints)
        .map((doc) => doc.userID)
        .indexOf(id) + 1
    );
  }

  public async getLastPlace(): Promise<IUserPoints> {
    const allPoints = await PointsModel.find({ guildID: this._guild.id });
    return allPoints.sort((a, b) => b.numPoints - a.numPoints)[allPoints.length - 1] as IUserPoints;
  }
}
