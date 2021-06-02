import { Snowflake, User } from 'discord.js';
import { StorageService } from './storage.service';

export class GameLeaderboardService {
  constructor(private _storageService: StorageService) {}

  public async updateLeaderboard(user: User, playerWon: boolean) {
    const id = user.id;

    const collections = await this._storageService.getCollections();
    const tttLeaderboard = collections.tttLeaderboard;
    const connectFourLeaderboard = collections.connectFourLeaderboard;
  }
}

export interface GameLeaderBoardEntry {
  userId: Snowflake;
  wins: number;
  loses: number;
  ties: number;
}
