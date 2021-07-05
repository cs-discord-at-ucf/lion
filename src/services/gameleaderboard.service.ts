import { EmbedFieldData, MessageEmbed, MessageOptions, Snowflake, User } from 'discord.js';
import mongoose, { Document } from 'mongoose';
import { Maybe } from '../common/types';
import { C4LeaderboardModel, TTTLeaderboardModel } from '../schemas/games.schema';
import { GuildService } from './guild.service';
import { LoggerService } from './logger.service';
import { StorageService } from './storage.service';

interface IUserOverallEntry {
  player: User;
  numWins: number;
  numLoses: number;
  numTies: number;
}

export interface IGameLeaderBoardEntry {
  userId: Snowflake;
  guildId: Snowflake;
  games: IGame[];
}

export type GameLeaderBoardDocument = IGameLeaderBoardEntry & Document;

export interface IGame {
  opponent: Snowflake;
  result: GameResult;
}

export type GameDocument = IGame & Document;

export enum GameResult {
  Won = 1,
  Lost,
  Tie,
}

export enum GameType {
  TicTacToe = 1,
  ConnectFour,
}

type GameCollectionTypes = 'tttLeaderboard' | 'connectFourLeaderboard';

export class GameLeaderboardService {
  public gameAliases: Record<GameType, string[]> = {
    [GameType.TicTacToe]: ['ttt', 'tictactoe'],
    [GameType.ConnectFour]: ['c4', 'connectfour', 'connect-four'],
  };

  private _gameEnumToString: Record<GameType, string> = {
    [GameType.TicTacToe]: 'Tic-Tac-Toe',
    [GameType.ConnectFour]: 'Connect 4',
  };

  private _gameEnumToCollection: Record<GameType, mongoose.Model<GameLeaderBoardDocument>> = {
    [GameType.TicTacToe]: this._getCollection('tttLeaderboard'),
    [GameType.ConnectFour]: this._getCollection('connectFourLeaderboard'),
  };

  constructor(
    private _storageService: StorageService,
    private _guildService: GuildService,
    private _loggerService: LoggerService
  ) {}

  public async updateLeaderboard(user: User, game: GameType, gameData: IGame) {
    const leaderboard = this._gameEnumToCollection[game];

    if (!leaderboard) {
      this._loggerService.error(`Could not get leaderboard for ${game}`);
      return;
    }

    // Get the entry for the user
    let userDoc = await leaderboard.findOne({
      userId: user.id,
      guildId: this._guildService.get().id,
    });

    // if the user doesnt have an entry yet, make one for them
    if (!userDoc) {
      await leaderboard.create({
        userId: user.id,
        guildId: this._guildService.get().id,
        games: [],
      });

      userDoc = await leaderboard.findOne({
        userId: user.id,
        guildId: this._guildService.get().id,
      });
    }

    if (!userDoc) {
      this._loggerService.error(
        `Failed to make or find entry for user with id ${user.id} in leaderboard ${leaderboard} for game ${game}`
      );
      return;
    }

    // update the user's document by pushing the new game data
    // to the user's array
    await leaderboard.updateOne(
      { userId: user.id },
      { $push: { games: { $each: [gameData], $position: 0 } } }
    );
  }

  private _getCollection(gameType: GameCollectionTypes): mongoose.Model<GameLeaderBoardDocument> {
    return gameType === 'tttLeaderboard' ? TTTLeaderboardModel : C4LeaderboardModel;
  }

  public async createOverallLeaderboardEmbed(user: User, game: GameType): Promise<MessageOptions> {
    const leaderboard: mongoose.Model<GameLeaderBoardDocument> = this._gameEnumToCollection[game];
    if (!leaderboard) {
      this._loggerService.error(`Could not get leaderboard for ${game}`);
      return { content: 'Unable to get the leaderboards at this time' };
    }

    const collectionData: IUserOverallEntry[] = await this._parseCollectionData(leaderboard);
    const embed = new MessageEmbed();
    embed.setTitle(`${this._gameEnumToString[game]} Leaderboard`);

    // If we were able to find user's data, put them at the top
    const userFieldData = this._createPlayerFieldData(user, collectionData);
    if (userFieldData) {
      const { name, value } = userFieldData;
      embed.addField(name, value, false); // Caller's rank
    }

    collectionData
      .slice(0, 24)
      .forEach((e, i) =>
        embed.addField(
          `${i + 1}. ${e.player.username}`,
          `*Wins:* ${e.numWins}\n` + `*Loses:* ${e.numLoses}\n` + `*Ties:* ${e.numTies}`,
          true
        )
      );
    return { embeds: [embed] };
  }

  public async createPlayerLeaderboardEmbed(user: User, game: GameType) {
    const leaderboard: mongoose.Model<GameLeaderBoardDocument> = this._gameEnumToCollection[game];
    if (!leaderboard) {
      this._loggerService.error(`Could not get leaderboard for ${game}`);
      return 'Unable to get the leaderboards at this time';
    }

    const entries: IUserOverallEntry[] = await this._parseCollectionData(leaderboard);
    const userFieldData = this._createPlayerFieldData(user, entries);
    if (!userFieldData) {
      return null;
    }

    const { name, value } = userFieldData;

    const embed = new MessageEmbed();
    embed.setTitle(`${this._gameEnumToString[game]} Leaderboard`);
    embed.addField(name, value);
    return embed;
  }

  private _createPlayerFieldData(user: User, entries: IUserOverallEntry[]): Maybe<EmbedFieldData> {
    const [userEntry] = entries.filter((e) => e.player === user);
    if (!userEntry) {
      return null;
    }

    const userRank = entries.indexOf(userEntry);
    return {
      name: `${userRank + 1}. ${userEntry.player.username} (You)`,
      value:
        `*Wins:* ${userEntry.numWins}\n` +
        `*Loses:* ${userEntry.numLoses}\n` +
        `*Ties:* ${userEntry.numTies}`,
    };
  }

  private async _parseCollectionData(leaderboard: mongoose.Model<GameLeaderBoardDocument>): Promise<IUserOverallEntry[]> {
    const res = await leaderboard.find({ guildId: this._guildService.get().id });
    return res.reduce((acc: IUserOverallEntry[], doc: IGameLeaderBoardEntry) => {
      const stats = this._getOverallStats(doc);
      if (stats) {
        acc.push(stats);
      }

      return acc;
    }, [])
      .sort((a: IUserOverallEntry, b: IUserOverallEntry) => b.numWins - a.numWins);
  }

  public async createMatchupLeaderboardEmbed(userOne: User, userTwo: User, gameType: GameType): Promise<MessageOptions> {
    const leaderboard: mongoose.Model<GameLeaderBoardDocument> = this._gameEnumToCollection[gameType];
    if (!mongoose.connection.readyState) {
      this._loggerService.error(`Could not get leaderboard for ${gameType}`);
      return { content: 'Unable to get the leaderboards at this time' };
    }

    const entries: IGameLeaderBoardEntry[] = await leaderboard
      .find({ guildId: this._guildService.get().id });

    const [userOneEntry] = entries.filter((e) => e.userId === userOne.id);

    if (!userOneEntry) {
      return { content: `User \`${userOne.username}\` not found` };
    }

    const matchupGames = userOneEntry.games.filter((game: IGame) => game.opponent === userTwo.id);

    let userOneWins = 0;
    let userTwoWins = 0;
    let ties = 0;

    matchupGames.forEach((game: IGame) => {
      switch (game.result) {
        case GameResult.Won:
          userOneWins++;
          break;
        case GameResult.Lost:
          userTwoWins++;
          break;
        case GameResult.Tie:
          ties++;
          break;
      }
    });

    const embed = new MessageEmbed();
    embed.setTitle(`${this._gameEnumToString[gameType]} Matchup`);
    embed.addField(
      // `${userRank + 1}. ${userEntry.player.username} (You)`,
      `${userOne.username} vs ${userTwo.username}`,
      `__Wins:__ ${userOneWins} - ${userTwoWins}\n` +
        `__Loses:__ ${userTwoWins} - ${userOneWins}\n` +
        `__Ties:__ ${ties}`
    );
    return { embeds: [embed] };
  }

  private _getOverallStats(entry: IGameLeaderBoardEntry): Maybe<IUserOverallEntry> {
    const user = this._guildService.get().members.cache.get(entry.userId)?.user;
    if (!user) {
      return null;
    }

    let wins = 0;
    let loses = 0;
    let ties = 0;
    entry.games.forEach((game) => {
      if (game.result === GameResult.Won) {
        wins++;
      }
      if (game.result === GameResult.Lost) {
        loses++;
      }
      if (game.result === GameResult.Tie) {
        ties++;
      }
    });

    return {
      player: user,
      numWins: wins,
      numLoses: loses,
      numTies: ties,
    };
  }
}
