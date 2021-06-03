import { GuildMember, MessageEmbed, MessageReaction, ReactionCollector, User } from 'discord.js';
import moment from 'moment';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { GameResult, Games } from '../../services/gameleaderboard.service';

export class TicTacToe extends Plugin {
  public name: string = 'Tic Tac Toe';
  public description: string = 'Tic Tac Toe';
  public usage: string = 'tictactoe @<user>';
  public pluginAlias = ['ttt'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Games;
  public commandPattern: RegExp = /<@!?(\d+)>/;

  private _moves: string[] = ['1️⃣', '2️⃣', '3️⃣', '🔄'];

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const guild = message.guild;
    if (!guild) {
      return;
    }

    const match = args.join(' ').match(this.commandPattern);
    if (!match) {
      await message.reply('Could not find a user with that name.');
      return;
    }

    // User ID is the the first group of match
    const [, uID] = match;
    const oppMember = guild.members.cache.get(uID);
    if (!oppMember) {
      await message.reply('Could not find a user with that name.');
      return;
    }

    await this._createGame(message, oppMember);
  }

  private async _createGame(message: IMessage, oppMember: GuildMember) {
    const game = new TTTGame(message.author, oppMember.user);
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
    });

    collector.on('end', async () => {
      const convertToResult = (x: number) => {
        return game.getWinner() === x
          ? GameResult.Won
          : game.checkTie()
          ? GameResult.Tie
          : GameResult.Lost;
      };

      // update the leaderboard for the author of the game
      await this.container.gameLeaderboardService.updateLeaderboard(
        message.author,
        Games.TicTacToe,
        {
          opponent: oppMember.user.id,
          result: convertToResult(-1),
        }
      );

      // update the leaderboard of the opponent
      await this.container.gameLeaderboardService.updateLeaderboard(
        oppMember.user,
        Games.TicTacToe,
        {
          opponent: message.author.id,
          result: convertToResult(1),
        }
      );

      msg.reactions.removeAll().catch();
      msg.channel.send(
        (await this.container.gameLeaderboardService.createLeaderboardEmbed(Games.TicTacToe)) ||
          'Hi'
      );
    });
  }
}

class TTTGame {
  public collector?: ReactionCollector;

  private _playerA: User;
  private _playerB: User;
  private _board: number[][];
  private _flagToEmoji: Record<number, string> = {
    [-1]: ':regional_indicator_o:',
    [0]: '🟦',
    [1]: ':regional_indicator_x:',
  };

  private _choosing: Choosing = Choosing.Row;
  private _winner: Maybe<number> = null;
  private _row = -1;
  private _col = -1;

  // -1 is playerA
  private currentPlayer: number = -1;

  constructor(playerA: User, playerB: User) {
    this._playerA = playerA;
    this._playerB = playerB;

    // Make 3x3 board of 0
    this._board = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
  }

  public getCurrentPlayer() {
    if (this.currentPlayer === -1) {
      return this._playerA;
    }

    return this._playerB;
  }

  public getWinner() {
    return this._winner;
  }

  public getLoser() {
    // -1 means playerA won
    return this.getWinner() === -1 ? this._playerB : this._playerA;
  }

  public reset() {
    this._choosing = Choosing.Row;
    this._row = -1;
    this._col = -1;
  }

  public async choose(index: number, msg: IMessage) {
    if (this._choosing === Choosing.Row) {
      this._row = index;
      this._choosing = Choosing.Column;
      await msg.edit(this.showBoard());
      return;
    }

    this._col = index;

    // Make the move -------------------
    // Make sure its not overwriting
    if (this._board[this._col][this._row] !== 0) {
      this.reset();
      return;
    }

    this._board[this._col][this._row] = this.currentPlayer;
    if (this._checkWin()) {
      this._winner = this.currentPlayer;
    }

    this._flipTurn();
    this.reset();
    await msg.edit(this.showBoard());
    // Reset where the player is choosing
  }

  private _flipTurn() {
    this.currentPlayer *= -1;
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
  public checkTie() {
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
          `** is the winner!`
      );

      return embed;
    }

    if (this.checkTie()) {
      this.collector?.stop();
      embed.setDescription(`${boardAsString}\n**It's a tie!**`);
      return embed;
    }

    const bold = (s: string) => {
      return `**${s}**`;
    };

    const playerATitle =
      this.currentPlayer === -1 ? bold(this._playerA.username) : this._playerA.username;

    const playerBTitle =
      this.currentPlayer === 1 ? bold(this._playerB.username) : this._playerB.username;

    const choosingString = `Choose **${this._choosing === Choosing.Row ? 'X' : 'Y'}**`;
    embed.setDescription(`${boardAsString}\n${playerATitle} vs ${playerBTitle}\n${choosingString}`);
    return embed;
  }
}

enum Choosing {
  Row,
  Column,
}
