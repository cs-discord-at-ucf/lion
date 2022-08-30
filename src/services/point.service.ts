import { Guild, Role, TextChannel, MessageEmbed, EmojiIdentifierResolvable } from 'discord.js';
import { IUserPoints, Maybe } from '../common/types';
import { PointsDocument, PointsModel } from '../schemas/points.schema';
import { GuildService } from './guild.service';
import Constants from '../common/constants';
import { UserService } from './user.service';
import ms from 'ms';

export class PointService {
  private _guild: Guild;
  private _userservice: UserService;
  private _tacoKingRole: Role;
  private _tacoKingEmoji: Maybe<EmojiIdentifierResolvable> = null;

  constructor(private _guildService: GuildService, private _userService: UserService) {
    this._guild = this._guildService.get();
    this._userservice = this._userService;
    this._tacoKingRole = this._guild.roles.cache.find((r) => r.name === Constants.Roles.TacoKing)!;
    this._tacoKingEmoji = this._guildService.getEmoji('tacoking') ?? '🌮';
  }

  public async awardPoints(id: Maybe<string>, amount: number) {
    if (!id) {
      return;
    }

    // cache the #1 point holder before points are awarded
    const [{ userID: kingBeforeAwardID }] = await this.getTopPoints(1);

    const userDoc = await this.getUserPointDoc(id);
    await PointsModel.updateOne(userDoc, { $inc: { numPoints: amount } });

    const [{ userID: kingAfterAwardID }] = await this.getTopPoints(1);

    // the king has changed!
    if (kingBeforeAwardID !== kingAfterAwardID) {
      // get the old and new king members
      const [prevKingUser, newKingUser] = [kingBeforeAwardID, kingAfterAwardID].map((c) =>
        this._userservice.getMember(c)
      );

      // remove the taco king role from the previous king
      // and give the role to the new king
      await Promise.all([
        prevKingUser?.roles.remove(this._tacoKingRole),
        newKingUser?.roles.add(this._tacoKingRole),
      ]);

      // update the crowning date for the new king
      await PointsModel.updateOne(
        { userID: kingAfterAwardID, guildID: this._guild.id },
        { lastKingCrowning: new Date() }
      );

      const crownedTime = await this.getCrownedTime(kingBeforeAwardID);

      // we are gonna send a message in the games channel
      const gamesChan = this._guildService.getChannel(Constants.Channels.Public.Games);

      const embed = new MessageEmbed()
        .setTitle(`${this._tacoKingEmoji} Taco King Overthrown! ${this._tacoKingEmoji}`)
        .setDescription(
          `${prevKingUser?.user ?? 'The old king'} is no longer the Taco King!\n${
            newKingUser?.user ?? 'Someone else'
          } is the new ${this._tacoKingRole}!`
        )
        .setColor(this._tacoKingRole.color)
        .setFooter({
          text: `They were the king for ${ms(crownedTime, {
            long: true,
          })}`,
        });

      (gamesChan as TextChannel).send({ embeds: [embed] });
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

  // returns how long since the user was last crowned king
  public async getCrownedTime(id: string): Promise<number> {
    // when was the previous king crowned?
    let { lastKingCrowning: prevKingCrowiningDate } = await this.getUserPointDoc(id);
    prevKingCrowiningDate ??= new Date();
    // how long ago was the previous king crowned?
    const crownedTime = new Date().getTime() - prevKingCrowiningDate.getTime();

    return crownedTime;
  }
}
