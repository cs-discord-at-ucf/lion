import { GuildMember, MessageEmbed, MessageReaction, ReactionCollector, User } from 'discord.js';
import ms from 'ms';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, Maybe } from '../../common/types';
import { GameResult, GameType } from '../../services/gameleaderboard.service';

export default class ConnectFourPlugin extends Plugin {
  public commandName: string = 'connect4';
  public name: string = 'Connect Four';
  public description: string = 'Play connect four with a friend';
  public usage: string = 'connectfour <user tag>';
  public pluginAlias = ['connect4', 'connect', 'c4'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Games;

  public static MOVES: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const guild = message.guild;
    if (!guild) {
      return;
    }

    const opponent = message.mentions.members?.first();

    if (!opponent) {
      await message.reply('Could not find a user with that name.');
      return;
    }

    // Make sure we're not playing against ourselves.
    if (opponent.id === message.member?.id) {
      await message.reply("Sorry but you can't play against yourself.");
      return;
    }

    await this._createGame(message, opponent);
  }

  private async _createGame(message: IMessage, oppMember: GuildMember) {
    const game = new ConnectFourGame(
      message.author,
      oppMember.user,
      message.mentions.members?.first()?.id === this.container.clientService.user?.id
    );
    const msg = await message.reply({ embeds: [game.showBoard()] });
    await Promise.all(ConnectFourPlugin.MOVES.map((emoji) => msg.react(emoji)));

    const filter = (react: MessageReaction, user: User) =>
    // Only target our game emojis and no bot reactions
      ConnectFourPlugin.MOVES.includes(react.emoji.name!) && user.id !== msg.author.id;

    // Listen on reactions
    const collector = msg.createReactionCollector(
      {
        filter,
        time: ms('10m'),
      }
    );
    game.collector = collector;

    collector.on('collect', async (react: MessageReaction) => {
      // Last reaction.
      const user = react.users.cache.last();
      if (user !== game.getCurrentPlayer()) {
        // Dump reactions from invalid players.
        await react.users.remove(user);
        return;
      }

      await game.move(ConnectFourPlugin.MOVES.indexOf(react.emoji.name!), msg);

      if (game.getGameOver()) {
        collector.stop();
        return;
      }

      await react.users.remove(user);
      collector.resetTimer();
    });

    collector.on('end', async () => {
      // Game never finished, and timed out
      if (!game.getGameOver()) {
        return;
      }

      const convertToResult = (u: User) => {
        if (game.getWinner() === u) {
          return GameResult.Won;
        }

        if (game.checkTie() === true) {
          return GameResult.Tie;
        }

        return GameResult.Lost;
      };

      // update the leaderboard for the author of the game
      const updates = [
        this.container.gameLeaderboardService.updateLeaderboard(
          message.author,
          GameType.ConnectFour,
          {
            opponent: oppMember.user.id,
            result: convertToResult(message.author),
          }
        ),
        this.container.gameLeaderboardService.updateLeaderboard(
          oppMember.user,
          GameType.ConnectFour,
          {
            opponent: message.author.id,
            result: convertToResult(oppMember.user),
          }
        ),
      ];

      await Promise.all(updates);
      msg.reactions.removeAll();
    });
  }
}

class ConnectFourGame {
  public collector?: ReactionCollector;

  private _playerA: User;
  private _playerB: User;
  private _board: number[][];
  private _background: string = '🟦';
  private _flagToEmoji: Record<number, string> = {
    [-1]: '🔴',
    [0]: '󠀠󠀠󠀠⬛',
    [1]: '🟡',
  };
  private _rows: number = 6;
  private _cols: number = 7;

  private _currentPlayer: number = -1;

  private _playingLion: boolean;
  private _aiDepth = 4;

  private _winner: Maybe<number> = null;
  private _tie: boolean = false;
  private _gameOver: boolean = false;

  private _searchDX: number[] = [-1, -1, 0, 1, 1, 1, 0, -1];
  private _searchDY: number[] = [0, -1, -1, -1, 0, 1, 1, 1];

  constructor(playerA: User, playerB: User, playingLion: boolean) {
    this._playerA = playerA;
    this._playerB = playerB;

    this._playingLion = playingLion;

    this._board = Array.from(Array(this._rows), () => Array(this._cols).fill(0));
  }

  public getCurrentPlayer() {
    return this._currentPlayer === -1 ? this._playerA : this._playerB;
  }

  public getGameOver() {
    return this._gameOver;
  }

  public getWinner() {
    if (this._winner === -1) {
      return this._playerA;
    }
    if (this._winner === 1) {
      return this._playerB;
    }
    return null;
  }

  public getLoser() {
    // Return opposite of winner
    return this.getWinner() === this._playerA ? this._playerB : this._playerA;
  }

  public getTie() {
    return this._tie;
  }

  public async move(col: number, msg: IMessage) {
    // Make move.
    if (!this._dropPiece(col)) {
      return;
    }

    await this._updateGameState(msg);

    // Make Lion's move if the user is playing Lion.
    if (!this._gameOver && this._playingLion) {
      this._lionMove();
      await this._updateGameState(msg);
    }

    return;
  }

  private _lionMove() {
    const bestCol = this._getBestMove();
    this._dropPiece(bestCol);
  }

  // Turn on the beast.
  private _getBestMove(): number {
    const moves: { col: number; val: number }[] = [];
    for (let col = 0; col < this._cols; col++) {
      // Make move.
      if (!this._dropPiece(col)) {
        continue;
      }

      // Evaluate.
      moves.push({ col, val: this._minimax(this._currentPlayer * -1, 0) });
      // Backtrack.
      this._removeTopPiece(col);
    }

    // Sort moves from best to worst.
    moves.sort((a, b) => b.val - a.val);

    // Calculate all moves with equal value, and return one.
    const bestMoves = moves.filter((move) => move.val === moves[0].val);
    const randomMove = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomMove].col;
  }

  // Minimax! To read more check out https://en.wikipedia.org/wiki/Minimax
  // Note: -1 is minimizing, 1 is maximizing
  // Value of a move is rated from [-4, -4];
  private _minimax(currentPlayer: number, depth: number) {
    // If we have reached a win state, then the LAST move won.
    if (this._checkWin()) {
      return -4 * currentPlayer;
    }
    if (this.checkTie()) {
      return 0;
    }
    // If we reached depth, then evaluate the board.
    // We use a very simple evaluation: longest player 1 chain (ai) - longest player -1 chain (player)
    // This causes Lion to simply try to minimize Player 1's success,
    // While our _checkWin case takes over when it's time to clinch victory.
    if (depth === this._aiDepth) {
      return -currentPlayer * (this._longestChainOnBoard(1) - this._longestChainOnBoard(-1));
    }

    const moves: number[] = [];
    for (let col = 0; col < this._cols; col++) {
      // Make move.
      if (!this._dropPiece(col, currentPlayer)) {
        continue;
      }

      // Evaluate (recursive).
      moves.push(this._minimax(currentPlayer * -1, depth + 1));
      // Backtrack.
      this._removeTopPiece(col);
    }

    // Maximizing player wants the *highest* value
    if (currentPlayer === 1) {
      return Math.max(...moves);
    }
    return Math.min(...moves);
  }

  private _dropPiece(col: number, currentPlayer?: number): boolean {
    let row = this._getFirstObjectInColumn(col);
    // Place object one row above first object.
    row--;

    if (row === -1) {
      return false;
    }

    this._board[row][col] = currentPlayer ? currentPlayer : this._currentPlayer;

    return true;
  }

  private _removeTopPiece(col: number): void {
    const row = this._getFirstObjectInColumn(col);

    if (row === this._rows) {
      return;
    }

    this._board[row][col] = 0;
  }

  private _getFirstObjectInColumn(col: number): number {
    // Find first obstruction from top down in column.
    let row = 0;
    while (row < this._rows && this._board[row][col] === 0) {
      row++;
    }
    return row;
  }

  private _longestChainOnBoard(player?: number): number {
    return this._board.reduce(
      (longestChainOnBoard, rowObj, row) =>
        rowObj.reduce(
          (longestChainStartingInRow, _, col) =>
            Math.max(longestChainStartingInRow, this._longestChainAtLocation(row, col, player)),
          longestChainOnBoard
        ),
      0
    );
  }

  private _longestChainAtLocation(row: number, col: number, player?: number): number {
    const chains: number[] = Array(8).fill(0);
    const owner = this._board[row][col];
    if (owner === 0) {
      return 0;
    }
    // For each possible chain direction
    for (let direction = 0; direction < 8; direction++) {
      // For all locations in chain of length four
      for (let distance = 0; distance < 4; distance++) {
        const newRow: number = row + this._searchDY[direction] * distance;
        const newCol: number = col + this._searchDX[direction] * distance;

        if (this._validAndOwned(newRow, newCol, player ? player : owner)) {
          chains[direction]++;
        }
      }
    }

    // Return whether or not we found a chain of four.
    return Math.max(...chains);
  }

  // Returns if a postion is valid and owned by the current player.
  private _validAndOwned(row: number, col: number, player: number): boolean {
    return (
      row >= 0 &&
      row < this._rows &&
      col >= 0 &&
      col < this._cols &&
      this._board[row][col] === player
    );
  }

  private async _updateGameState(msg: IMessage): Promise<void> {
    // Check for win.
    if (this._checkWin()) {
      this._winner = this._currentPlayer;
      this._gameOver = true;
    } else if (this.checkTie()) {
      this._tie = true;
      this._gameOver = true;
    } else {
      this._changeTurn();
    }
    await msg.edit({ embeds: [this.showBoard()] });
  }

  private _changeTurn(): void {
    this._currentPlayer *= -1;
  }

  private _checkWin(): boolean {
    return this._longestChainOnBoard() === 4;
  }

  public checkTie(): boolean {
    // Return if the top row is full
    return this._board[0].every((item) => item !== 0);
  }

  public showBoard() {
    const wrapBackground = (middle: string) => {
      return this._background + middle + this._background;
    };

    const bold = (s: string) => {
      return `**${s}**`;
    };

    const boardAsString = [
      ...this._board.map((row) =>
        wrapBackground(row.map((col) => this._flagToEmoji[col]).join(''))
      ),
      Array(this._cols + 2)
        .fill(this._background)
        .join(''),
    ].join('\n');

    const bottomRow = wrapBackground(ConnectFourPlugin.MOVES.join(''));

    const playerA =
      this._currentPlayer === -1 ? bold(this._playerA.username) : this._playerA.username;
    const playerB =
      this._currentPlayer === 1 ? bold(this._playerB.username) : this._playerB.username;

    const turnMessage = `🔴 ${playerA} vs ${playerB} 🟡`;
    const winnerEmoji = this._currentPlayer === -1 ? '🔴' : '🟡';
    const winnerMessage = `${winnerEmoji} Game over!! ${
      this._winner === -1 ? bold(playerA) : bold(playerB)
    } wins! ${winnerEmoji}`;
    const tieMessage = 'Uh oh, looks like it was a draw :(';

    const result = this._winner ? winnerMessage : this._tie ? tieMessage : turnMessage;
    const fullMessage = [boardAsString, bottomRow, result].join('\n');

    const embed = new MessageEmbed();
    embed.setTitle('Connect Four');
    embed.setDescription(fullMessage);

    return embed;
  }
}
