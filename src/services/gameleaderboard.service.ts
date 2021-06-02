import { MessageEmbed, Snowflake, User } from 'discord.js';
import { Collection } from 'mongodb';
import { GuildService } from './guild.service';
import { StorageService } from './storage.service';

export class GameLeaderboardService {
  private leaderboardForGame: Record<Games, string> = {
    [Games.TicTacToe]: 'tttLeaderboard',
    [Games.ConnectFour]: 'connectFourLeaderboard',
  };

  constructor(private _storageService: StorageService, private _guildService: GuildService) {}

  public async updateLeaderboard(user: User, game: Games, gameData: Game) {
    // const collections = await this._storageService.getCollections();

    // const tttLeaderboard = collections.tttLeaderboard;
    // const connectFourLeaderboard = collections.connectFourLeaderboard;
    // if (!connectFourLeaderboard || !tttLeaderboard) {
    //   return;
    // }

    // const leaderboard = game === Games.TicTacToe ? tttLeaderboard : connectFourLeaderboard;
    const leaderboard = await this._gameToCollection(game);

    if (!leaderboard) {
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
      return;
    }

    // update the user's document by pushing the new game data
    // to the user's array
    await leaderboard.updateOne(
      { userId: user.id },
      { $push: { games: { $each: [gameData], $position: 0 } } }
    );
  }

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
    const collections = await this._storageService.getCollections();
    const leaderboard =
      game === Games.TicTacToe ? collections.tttLeaderboard : collections.connectFourLeaderboard;
    if (!leaderboard) {
      return;
    }

    const entries: LeaderboardEntry[] = (await leaderboard.find().toArray())
      .reduce((acc: LeaderboardEntry[], doc) => {
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
      .sort((a, b) => a.numWins - b.numWins);

    const embed = new MessageEmbed();
    embed.setTitle(`${this.leaderboardForGame[game]} Leaderboards`);
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
