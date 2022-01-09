import { Guild } from 'discord.js';
import { IUserPoints, Maybe } from '../common/types';
import { PointsDocument, PointsModel } from '../schemas/points.schema';
import { GuildService } from './guild.service';

export class PointService {
  private _guild: Guild;

  constructor(private _guildService: GuildService) {
    this._guild = this._guildService.get();
  }

  public async awardPoints(id: Maybe<string>, amount: number) {
    if (!id) {
      return;
    }

    const userDoc = await this.getUserPointDoc(id);
    await PointsModel.updateOne(userDoc, { numPoints: userDoc.numPoints + amount });
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
