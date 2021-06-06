import { User } from 'discord.js';
import { IContainer } from './types';
import { GameResult, GameType } from '../services/gameleaderboard.service';
export default abstract class Game {
  private _container: IContainer;
  private _game: GameType;
  
  protected playerA: User;
  protected playerB: User;

  constructor(container: IContainer, game: GameType, playerA: User, playerB: User) {
    this._container = container;
    this._game = game;
    this.playerA = playerA;
    this.playerB = playerB;
  }

  // Records results for a game.
  async recordResult(): Promise<void> {
    const playerResult = (player: User): GameResult => {
      if (this.checkTie()) {
       return GameResult.Tie;
      }
        
      return this.getWinner() === player ? GameResult.Won : GameResult.Lost;
    }

    const updates = [
      this._container.gameLeaderboardService.updateLeaderboard(
        this.playerA,
        this._game,
        {
          opponent: this.playerB.id,
          result: playerResult(this.playerA),
        }
      ),
      this._container.gameLeaderboardService.updateLeaderboard(
        this.playerB,
        this._game,
        {
          opponent: this.playerA.id,
          result: playerResult(this.playerB),
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