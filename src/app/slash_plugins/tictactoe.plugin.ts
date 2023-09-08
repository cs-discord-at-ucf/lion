import {
  ButtonInteraction,
  CommandInteraction,
  InteractionCollector,
  Message,
  MessageEmbed,
  User,
} from 'discord.js';
import ms from 'ms';
import { ISlashCommand } from '../../common/slash';
import { IContainer, Maybe } from '../../common/types';
import { GameResult, GameType } from '../../services/gameleaderboard.service';

const moves: string[] = ['1️⃣', '2️⃣', '3️⃣', '🔄'];

class TTTGame {
  public collector?: InteractionCollector<ButtonInteraction>;

  private _playerA: User;
  private _playerB: User;
  private _playingLion: boolean;
  private _board: number[][];
  private _flagToEmoji: Record<number, string> = {
    [-1]: ':regional_indicator_o:',
    [0]: '🟦',
    [1]: ':regional_indicator_x:',
  };

  private _choosing: Choosing = Choosing.Column;
  private _winner: Maybe<number> = null;
  private _gameOver: boolean = false;
  private _row = -1;
  private _col = -1;

  // -1 is playerA
  private _currentPlayer: number = -1;

  constructor(playerA: User, playerB: User, playingLion: boolean) {
    this._playerA = playerA;
    this._playerB = playerB;
    this._playingLion = playingLion;

    // Make 3x3 board of 0
    this._board = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
  }

  public getCurrentPlayer() {
    if (this._currentPlayer === -1) {
      return this._playerA;
    }

    return this._playerB;
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
    // -1 means playerA won
    return this.getWinner() === this._playerA ? this._playerB : this._playerA;
  }

  public getGameOver() {
    return this._gameOver;
  }

  public reset() {
    this._choosing = Choosing.Column;
    this._row = -1;
    this._col = -1;
  }

  public async choose(index: number, interaction: ButtonInteraction) {
    if (this._choosing === Choosing.Column) {
      this._col = index;
      this._choosing = Choosing.Row;
      await interaction.update({ embeds: [this.showBoard()] });
      return;
    }

    this._row = index;

    // Make the move -------------------
    // Make sure its not overwriting
    if (this._board[this._row][this._col] !== 0) {
      await interaction.reply({
        content: `A move has already been made on (${this._col + 1}, ${this._row + 1})`,
        ephemeral: true,
      });
      this.reset();
      return;
    }

    this._board[this._row][this._col] = this._currentPlayer;
    this._checkAndUpdateWin();

    this._flipTurn();
    this.reset();

    if (this.checkTie() || this.getWinner()) {
      this._gameOver = true;
    }

    // Make Lion's move if necessary.
    if (!this._gameOver && this._currentPlayer === 1 && this._playingLion) {
      this._lionMove();
      this._checkAndUpdateWin();

      this._flipTurn();
    }

    if (this._gameOver) {
      await interaction.update({ embeds: [this.showBoard()], components: [] });
      this.collector?.stop();
      return;
    }

    await interaction.update({ embeds: [this.showBoard()] });
  }

  private _lionMove() {
    const { bestRow, bestCol } = this._getBestMove();
    this._board[bestRow][bestCol] = this._currentPlayer;
  }

  // Get's the strongest move for Lion
  private _getBestMove() {
    const moves: { row: number; col: number; val: number }[] = [];

    // For every location
    this._board.forEach((_, row) =>
      _.forEach((_, col) => {
        if (this._board[row][col] !== 0) {
          return;
        }

        // Make the move and evaluate the board state
        this._board[row][col] = this._currentPlayer;
        moves.push({ row, col, val: this._minimax(this._currentPlayer * -1) });
        // Backtrack.
        this._board[row][col] = 0;
      })
    );

    // Sort the moves in decreasing value
    moves.sort((a, b) => b.val - a.val);

    // Calculate all moves with equal value, and return one.
    const bestMoves = moves.filter((move) => move.val === moves[0].val);
    const randomMove = Math.floor(Math.random() * bestMoves.length);
    return { bestRow: moves[randomMove].row, bestCol: moves[randomMove].col };
  }

  // Minimax! To read more check out https://en.wikipedia.org/wiki/Minimax
  // Note: -1 is minimizing, 1 is maximizing
  private _minimax(currentPlayer: number) {
    // If we reached a win state, the LAST move won.
    if (this._checkWin()) {
      return -currentPlayer;
    }

    if (this.checkTie()) {
      return 0;
    }

    const moves: number[] = [];
    this._board.forEach((_, row) =>
      _.forEach((_, col) => {
        if (this._board[row][col] !== 0) {
          return;
        }
        this._board[row][col] = currentPlayer;
        moves.push(this._minimax(currentPlayer * -1));
        this._board[row][col] = 0;
      })
    );

    // Maximizing player wants the *highest* value
    if (currentPlayer === 1) {
      return Math.max(...moves);
    }
    return Math.min(...moves);
  }

  private _flipTurn() {
    this._currentPlayer *= -1;
  }

  private _checkAndUpdateWin() {
    if (this._checkWin()) {
      this._winner = this._currentPlayer;
      this._gameOver = true;
    }
  }

  private _checkWin() {
    // Check rows
    if (this._checkWinHorizontally(this._board)) {
      return true;
    }

    const transposed = this._transpose(this._board);
    if (this._checkWinHorizontally(transposed)) {
      return true;
    }

    // Top-left to bottom-right
    const diagA = this._board.map((_, i) => {
      return this._board[i][i];
    });

    // Top-right to bottom-left
    const diagB = this._board.map((_, i) => {
      return this._board[this._board.length - i - 1][i];
    });

    const sumsOfDiags = [diagA, diagB].map((diag) => this._sumArray(diag));
    return sumsOfDiags.some((diag) => Math.abs(diag) === 3);
  }

  // Returns the array rotated 90° clock-wise
  private _transpose(board: number[][]) {
    return board.map((_, colIndex) => board.map((row) => row[colIndex]));
  }

  private _checkWinHorizontally(board: number[][]): boolean {
    return board.reduce((acc: boolean, row: number[]) => {
      return acc || Math.abs(this._sumArray(row)) === 3;
    }, false);
  }

  private _sumArray(arr: number[]) {
    return arr.reduce((acc, val) => acc + val);
  }

  // Return True if all spots are not 0
  public checkTie(): boolean {
    const containsZero = (arr: number[]) => {
      return arr.some((num) => num === 0);
    };

    return this._board.every((row) => !containsZero(row));
  }

  public showBoard() {
    const boardAsString = this._board
      // Convert each element of each row into an emoji
      // Join each column with a space, each row with a newline
      .map((row) => row.map((col) => this._flagToEmoji[col]).join(' '))
      .join('\n');

    const embed = new MessageEmbed();
    embed.setTitle('Tic Tac Toe');
    embed.setDescription(boardAsString);

    if (this._winner) {
      this.collector?.stop();
      embed.setDescription(
        `${boardAsString}\n**` +
          `${this._winner === -1 ? this._playerA.username : this._playerB.username}` +
          '** is the winner!'
      );

      return embed;
    }

    if (this.checkTie()) {
      embed.setDescription(`${boardAsString}\n**It's a tie!**`);
      return embed;
    }

    const bold = (s: string) => {
      return `**${s}**`;
    };

    const playerATitle =
      this._currentPlayer === -1 ? bold(this._playerA.username) : this._playerA.username;

    const playerBTitle =
      this._currentPlayer === 1 ? bold(this._playerB.username) : this._playerB.username;

    const choosingString = `Choose **${this._choosing === Choosing.Row ? 'Y' : 'X'}**`;
    embed.setDescription(`${boardAsString}\n${playerATitle} vs ${playerBTitle}\n${choosingString}`);
    return embed;
  }
}

enum Choosing {
  Row,
  Column,
}

async function createGame(container: IContainer, interaction: CommandInteraction, opponent: User) {
  const game = new TTTGame(
    interaction.user,
    opponent,
    opponent.id === container.clientService.user?.id
  );

  // Send the board will all the buttons
  const msg = (await interaction.reply({
    embeds: [game.showBoard()],
    components: [
      {
        type: 'ACTION_ROW',
        components: moves.map((emoji) => {
          return {
            type: 'BUTTON',
            customId: emoji,
            emoji: { name: emoji },
            style: 'SECONDARY',
          };
        }),
      },
    ],
    fetchReply: true,
  })) as Message;

  // Collect button interactions for making moves
  const collector = msg.createMessageComponentCollector({
    componentType: 'BUTTON',
    time: ms('10m'),
    // Assert one of the target buttons and not the bot
    filter: (buttonInteraction) =>
      moves.includes(buttonInteraction.customId) && buttonInteraction.user.id !== msg.author.id,
  });

  game.collector = collector;

  collector.on('collect', async (buttonInteraction) => {
    // Last person to react
    const user = buttonInteraction.user;
    if (user !== game.getCurrentPlayer()) {
      // Not one of the players
      await buttonInteraction.reply({
        content: 'This is not your turn!',
        ephemeral: true,
      });
      return;
    }

    // Get index of desired row/col
    const index = moves.indexOf(buttonInteraction.customId);

    // If its the undo button
    if (index === moves.indexOf('🔄')) {
      game.reset();
      await buttonInteraction.update({ embeds: [game.showBoard()] });
      return;
    }

    // Apply the move
    await game.choose(index, buttonInteraction);
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

      if (game.checkTie()) {
        return GameResult.Tie;
      }

      return GameResult.Lost;
    };

    // update the leaderboard for the author of the game
    const updates = [
      container.gameLeaderboardService.updateLeaderboard(interaction.user, GameType.TicTacToe, {
        opponent: opponent.id,
        result: convertToResult(interaction.user),
      }),
      container.gameLeaderboardService.updateLeaderboard(opponent, GameType.TicTacToe, {
        opponent: interaction.user.id,
        result: convertToResult(opponent),
      }),
    ];

    await Promise.all(updates).catch(container.loggerService.error);
  });
}

export default {
  name: 'tictactoe',
  commandName: 'tictactoe',
  description: 'Play a game of Tic Tac Toe',
  options: [
    {
      name: 'opponent',
      description: 'The user you want to play against',
      type: 'USER',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const opponent = interaction.options.getUser('opponent', true);

    if (opponent.id === interaction.user.id) {
      await interaction.reply({ content: 'You cannot play against yourself.', ephemeral: true });
      return;
    }

    await createGame(container, interaction, opponent);
  },
} satisfies ISlashCommand;
