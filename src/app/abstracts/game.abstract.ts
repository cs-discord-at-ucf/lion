import { User } from 'discord.js';
import { IContainer } from '../../common/types';
import { GameResult, GameType } from '../../services/gameleaderboard.service';
export default abstract class Game {
  private _container: IContainer;
  private _game: GameType;

  constructor(container: IContainer, game: GameType) {
    this._container = container;
    this._game = game;
  }

  // Records results for a game.
  async recordResult(): Promise<void> {
    const winner = this.getWinner();
    const loser = this.getLoser();

    const updates = [
      this._container.gameLeaderboardService.updateLeaderboard(
        winner,
        this._game,
        {
          opponent: loser.id,
          result: GameResult.Won,
        }
      ),
      this._container.gameLeaderboardService.updateLeaderboard(
        loser,
        this._game,
        {
          opponent: winner.id,
          result: GameResult.Lost,
        }
      )
    ];

    await Promise.all(updates);
  }

  /**
   * @returns User: The winner of the game
   */
  abstract getWinner(): User;

  /**
   * @returns User: The loser of the game
   */
  abstract getLoser(): User;

  /**
   * @returns boolean: Whether the game was a tie or not
   */
  abstract checkTie(): boolean;
}