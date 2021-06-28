import { GuildMember, MessageEmbed, MessageReaction, ReactionCollector, User } from 'discord.js';
import moment from 'moment';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { GameResult, GameType } from '../../services/gameleaderboard.service';

export default class TicTacToe extends Plugin {
  public commandName: string = 'tictactoe';
  public name: string = 'Tic Tac Toe';
  public description: string = 'Tic Tac Toe';
  public usage: string = 'tictactoe @<user>';
  public pluginAlias = ['ttt'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Games;

  private _moves: string[] = ['1️⃣', '2️⃣', '3️⃣', '🔄'];

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

    // Make sure we're not playing against ourselves...
    if (opponent.id === message.member?.id) {
      await message.reply("Sorry, you can't play against yourself.");
      return;
    }

    await this._createGame(message, opponent);
  }

  private async _createGame(message: IMessage, oppMember: GuildMember) {
    const game = new TTTGame(
      message.author,
      oppMember.user,
      oppMember.id === this.container.clientService.user?.id
    );
    const msg = await message.reply(game.showBoard());
    await Promise.all(this._moves.map((emoji) => msg.react(emoji)));

    // Create reactions for making moves
    const collector = msg.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        // Assert one of target emojis and not the bot
        this._moves.includes(reaction.emoji.name) && user.id !== msg.author.id,
      {
        time: moment.duration(10, 'minutes').asMilliseconds(),
      }
    );
    game.collector = collector;

    collector.on('collect', async (reaction: MessageReaction) => {
      // Last person to react
      const user = reaction.users.cache.last();
      if (user !== game.getCurrentPlayer()) {
        // Not one of the players
        await reaction.users.remove(user);
        return;
      }

      // Get index of desired row/col
      const index = this._moves.indexOf(reaction.emoji.name);

      // If its the undo button
      if (index === this._moves.indexOf('🔄')) {
        game.reset();
        await msg.edit(game.showBoard());
        await reaction.users.remove(user);
        return;
      }

      // Apply the move
      await game.choose(index, msg);
      await reaction.users.remove(user);
      collector.resetTimer();
    });

    collector.on('end', async () => {
      await msg.reactions.removeAll().catch();

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
        this.container.gameLeaderboardService.updateLeaderboard(
          message.author,
          GameType.TicTacToe,
          {
            opponent: oppMember.user.id,
            result: convertToResult(message.author),
          }
        ),
        this.container.gameLeaderboardService.updateLeaderboard(
          oppMember.user,
          GameType.TicTacToe,
          {
            opponent: message.author.id,
            result: convertToResult(oppMember.user),
          }
        ),
      ];

      await Promise.all(updates);
    });
  }
}

class TTTGame {
  public collector?: ReactionCollector;

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

  public async choose(index: number, msg: IMessage) {
    if (this._choosing === Choosing.Column) {
      this._col = index;
      this._choosing = Choosing.Row;
      await msg.edit(this.showBoard());
      return;
    }

    this._row = index;

    // Make the move -------------------
    // Make sure its not overwriting
    if (this._board[this._row][this._col] !== 0) {
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

    await msg.edit(this.showBoard());

    if (this._gameOver) {
      this.collector?.stop();
    }
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
