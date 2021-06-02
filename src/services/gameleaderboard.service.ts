import { MessageEmbed, Snowflake, User } from 'discord.js';
import { Collection } from 'mongodb';
import { GuildService } from './guild.service';
import { LoggerService } from './logger.service';
import { StorageService } from './storage.service';

export class GameLeaderboardService {
  private _gameEnumToString: Record<Games, string> = {
    [Games.TicTacToe]: 'Tic-Tac-Toe',
    [Games.ConnectFour]: 'Connect 4',
  };

  private _gameEnumToCollection: Record<Games, Function> = {
    [Games.TicTacToe]: this._getCollection('tttLeaderboard'),
    [Games.ConnectFour]: this._getCollection('connectFourLeaderboard'),
  };

  constructor(
    private _storageService: StorageService,
    private _guildService: GuildService,
    private _loggerService: LoggerService
  ) {}

  public async updateLeaderboard(user: User, game: Games, gameData: Game) {
    const leaderboard = await this._gameToCollection(game);

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
      await leaderboard.insertOne({
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

  private _getCollection(gameType: GameType): Function {
    const collections = this._storageService.getCollections();
    return async () => (await collections)[gameType];
  }

  // return the appropriate mongo collection used for the given game
  private async _gameToCollection(game: Games) {
    const collections = await this._storageService.getCollections();
    switch (game) {
      case Games.TicTacToe:
        return collections.tttLeaderboard;
      case Games.ConnectFour:
        return collections.connectFourLeaderboard;
    }
  }

  public async createLeaderboardEmbed(game: Games) {
    const leaderboard: Collection<GameLeaderBoardEntry> = await this._gameEnumToCollection[game]();
    if (!leaderboard) {
      this._loggerService.error(`Could not get leaderboard for ${game}`);
      return;
    }

    const entries: LeaderboardEntry[] = (await leaderboard.find().toArray())
      .reduce((acc: LeaderboardEntry[], doc: GameLeaderBoardEntry) => {
        const user = this._guildService.get().members.cache.get(doc.userId)?.user;
        if (!user) {
          return acc;
        }

        acc.push({
          player: user,
          numWins: doc.games.reduce(
            (numWins: number, gameObj) => numWins + Number(gameObj.result === GameResult.Won),
            0
          ),
        });
        return acc;
      }, [])
      .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.numWins - a.numWins);

    const embed = new MessageEmbed();
    embed.setTitle(`${this._gameEnumToString[game]} Leaderboard`);
    embed.setDescription(entries.map((e) => `${e.player}: wins: ${e.numWins}`).join('\n'));
    return embed;
  }
}

interface LeaderboardEntry {
  player: User;
  numWins: number;
}

export interface GameLeaderBoardEntry {
  userId: Snowflake;
  guildId: Snowflake;
  games: Game[];
}

export interface Game {
  opponent: Snowflake;
  result: GameResult;
}

export enum GameResult {
  Won = 1,
  Lost,
  Tie,
}

export enum Games {
  TicTacToe = 1,
  ConnectFour,
}

type GameType = 'tttLeaderboard' | 'connectFourLeaderboard';
