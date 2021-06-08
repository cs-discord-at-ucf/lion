import { User } from 'discord.js';
import { IContainer, Maybe } from './types';
import { GameResult, GameType } from '../services/gameleaderboard.service';
export default abstract class Game {
  protected container: IContainer;
  protected game: GameType;
  protected playerA: User;
  protected playerB: User;

  constructor(container: IContainer, game: GameType, playerA: User, playerB: User) {
    this.container = container;
    this.game = game;
    this.playerA = playerA;
    this.playerB = playerB;
  }

  // Records results for a game.
  async recordResult(): Promise<void> {
    // Do not evaluate games that timed out.
    if (!this.isOver) {
      return;
    }

    // Winner and Loser MUST be set by this method call.
    if (!this.isTie && (this.winner == null || this.loser == null)) {
      console.error(`
        Winner and/or loser null when recordResult() called on a non-tie game.
        Please set these fields in your implementation before calling this method.
      `);
      return;
    }

    const genResult: (player: User) => GameResult = (player: User) => {
      return this.isTie ? GameResult.Tie : this.winner === player ? GameResult.Won : GameResult.Tie;
    };

    const updates = [
      this.container.gameLeaderboardService.updateLeaderboard(this.playerA, this.game, {
        opponent: this.playerB.id,
        result: genResult(this.playerA),
      }),
      this.container.gameLeaderboardService.updateLeaderboard(this.playerB, this.game, {
        opponent: this.playerA.id,
        result: genResult(this.playerB),
      }),
    ];

    await Promise.all(updates);
  }

  abstract get winner(): Maybe<User>;
  abstract get loser(): Maybe<User>;

  abstract get isTie(): boolean;
  abstract get isOver(): boolean;
}
