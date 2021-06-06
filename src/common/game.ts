import { User } from 'discord.js';
import { IContainer } from './types';
import { GameResult, GameType } from '../services/gameleaderboard.service';
export default abstract class Game {
  private _container: IContainer;
  private _game: GameType;
  private _playerA: User;
  private _playerB: User;

  constructor(container: IContainer, game: GameType, playerA: User, playerB: User) {
    this._container = container;
    this._game = game;
    this._playerA = playerA;
    this._playerB = playerB;
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
        this._playerA,
        this._game,
        {
          opponent: this._playerB.id,
          result: playerResult(this._playerA),
        }
      ),
      this._container.gameLeaderboardService.updateLeaderboard(
        this._playerB,
        this._game,
        {
          opponent: this._playerA.id,
          result: playerResult(this._playerB),
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