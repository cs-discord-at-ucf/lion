import { User } from 'discord.js';
import { IContainer, Maybe } from './types';
import { GameResult, GameType } from '../services/gameleaderboard.service';
export default abstract class Game {
  protected _container: IContainer;
  protected _game: GameType;

  constructor(container: IContainer, game: GameType) {
    this._container = container;
    this._game = game;
  }

  // Records results for a game.
  async recordResult(): Promise<void> {
    // Do not evaluate games that timed out.
    if (!this.isOver) {
      return;
    }

    // Winner and Loser MUST be set by this method call.
    if (this.winner == null || this.loser == null) {
      console.error(`
        Winner and/or loser null when recordResult() called.
        Please set these fields in your implementation before calling this method.
      `);
      return;
    }

    const updates = [
      // Win for winner.
      this._container.gameLeaderboardService.updateLeaderboard(this.winner, this._game, {
        opponent: this.loser.id,
        result: GameResult.Won,
      }),
      // Loss for loser.
      this._container.gameLeaderboardService.updateLeaderboard(this.loser, this._game, {
        opponent: this.winner.id,
        result: GameResult.Lost,
      }),
    ];

    await Promise.all(updates);
  }

  abstract get winner(): Maybe<User>;
  abstract get loser(): Maybe<User>;

  abstract get isTie(): boolean;
  abstract get isOver(): boolean;
}