import {
  ButtonInteraction,
  CommandInteraction,
  InteractionCollector,
  InteractionUpdateOptions,
  Message,
  MessageEmbed,
  User,
} from 'discord.js';
import ms from 'ms';
import { ISlashCommand } from '../../common/slash';
import { Maybe, IContainer } from '../../common/types';
import { GameResult, GameType } from '../../services/gameleaderboard.service';

const moves: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

class ConnectFourGame {
  public collector?: InteractionCollector<ButtonInteraction>;

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

  private _timeoutId: ReturnType<typeof setTimeout> | undefined;

  private _moveTimeLimit: number = ms('2m');

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

  public async move(col: number, interaction: ButtonInteraction) {
    // Make move.
    if (!this._dropPiece(col)) {
      return;
    }

    await interaction.update(this._getNewGameStateMessage());

    // Make Lion's move if the user is playing Lion.
    if (!this._gameOver && this._playingLion) {
      this._lionMove();
      const embeds = this._getNewGameStateMessage();
      await (interaction.message as Message).edit(embeds);
    }

    // reset the move timer and renew it
    this._refreshTimer(interaction);

    return;
  }

  private _refreshTimer(interaction: ButtonInteraction) {
    clearTimeout(this._timeoutId);

    this._timeoutId = setTimeout(() => {
      const embeds = this._getNewGameStateMessage({ timedOut: true });
      (interaction.message as Message).edit(embeds);
    }, this._moveTimeLimit);
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

  private _getNewGameStateMessage(options?: { timedOut?: boolean }): InteractionUpdateOptions {
    // if timed out, previous player won
    if (options?.timedOut) {
      this._winner = this._currentPlayer * -1;
      this._gameOver = true;
    }
    // Check for win.
    else if (this._checkWin()) {
      this._winner = this._currentPlayer;
      this._gameOver = true;
    } else if (this.checkTie()) {
      this._tie = true;
      this._gameOver = true;
    } else {
      this._changeTurn();
    }

    const messageOptions: InteractionUpdateOptions = {
      embeds: [this.showBoard()],
    };

    if (this._gameOver) {
      messageOptions.components = [];
    }

    return messageOptions;
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

    const bottomRow = wrapBackground(moves.join(''));

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

async function createGame(container: IContainer, interaction: CommandInteraction, oppenent: User) {
  const game = new ConnectFourGame(
    interaction.user,
    oppenent,
    oppenent.id === container.clientService.user?.id
  );

  const msg = (await interaction.reply({
    embeds: [game.showBoard()],
    components: [
      {
        type: 'ACTION_ROW',
        components: moves.slice(0, 5).map((emoji) => ({
          type: 'BUTTON',
          customId: emoji,
          style: 'PRIMARY',
          emoji: emoji,
        })),
      },
      {
        type: 'ACTION_ROW',
        components: moves.slice(5, 7).map((emoji) => ({
          type: 'BUTTON',
          customId: emoji,
          style: 'PRIMARY',
          emoji: emoji,
        })),
      },
    ],
    fetchReply: true,
  })) as Message;

  const collector = msg.createMessageComponentCollector({
    componentType: 'BUTTON',
    filter: (i) => moves.includes(i.customId) && interaction.user.id !== msg.author.id,
  });

  game.collector = collector;

  collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
    // Last reaction.
    const user = buttonInteraction.user;
    if (user !== game.getCurrentPlayer()) {
      // Dump reactions from invalid players.
      await buttonInteraction.reply({
        content: 'This is not your turn!',
        ephemeral: true,
      });
      return;
    }

    await game.move(moves.indexOf(buttonInteraction.customId), buttonInteraction);

    if (game.getGameOver()) {
      collector.stop();
      return;
    }

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
      container.gameLeaderboardService.updateLeaderboard(interaction.user, GameType.ConnectFour, {
        opponent: oppenent.id,
        result: convertToResult(interaction.user),
      }),
      container.gameLeaderboardService.updateLeaderboard(oppenent, GameType.ConnectFour, {
        opponent: interaction.user.id,
        result: convertToResult(oppenent),
      }),
    ];

    await Promise.all(updates);
    msg.reactions.removeAll();
  });
}

export default {
  name: 'connectfour',
  commandName: 'connectfour',
  description: 'Play Connect Four with another user',
  options: [
    {
      name: 'opponent',
      description: 'The user you want to play against.',
      type: 'USER',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const guild = interaction.guild;

    if (!guild) {
      return;
    }

    const opponent = interaction.options.getUser('opponent', true);

    // Make sure we're not playing against ourselves
    if (opponent.id === interaction.user.id) {
      await interaction.reply({
        content: "You can't play against yourself!",
        ephemeral: true,
      });
      return;
    }

    createGame(container, interaction, opponent);
  },
} satisfies ISlashCommand;
