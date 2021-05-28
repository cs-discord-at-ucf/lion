import { GuildMember, MessageEmbed, MessageReaction, ReactionCollector, User } from 'discord.js';
import moment from 'moment';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, Maybe } from '../../common/types';

export class ConnectFourPlugin extends Plugin {
  public name: string = 'Connect Four';
  public description: string = 'Play connect four with a friend';
  public usage: string = 'connectfour <playertag>';
  public pluginAlias = ['connect4', 'connect', 'c4'];
  public permission: ChannelType = ChannelType.Public;
  public commandPattern: RegExp = /[^#]+#\d{4}/;

  public static moves: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const guild = message.guild;
    if (!guild) {
      return;
    }

    const opponent = args.join(' ');
    const oppMember = guild.members.cache.filter((m) => m.user.tag === opponent).first();
    if (!oppMember) {
      await message.reply('Could not find a user with that name.');
      return;
    }

    await this._createGame(message, oppMember);
  }

  private async _createGame(message: IMessage, oppMember: GuildMember) {
    const game = new ConnectFourGame(message.author, oppMember.user);
    const msg = await message.reply(game.showBoard());
    await Promise.all(ConnectFourPlugin.moves.map((emoji) => msg.react(emoji)));

    // Listen on reactions
    const collector = msg.createReactionCollector(
      (react: MessageReaction, user: User) =>
        // Only target our game emojis and no bot reactions
        ConnectFourPlugin.moves.includes(react.emoji.name) && user.id != msg.author.id,
      {
        time: moment.duration(10, 'minutes').asMilliseconds(),
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

      await game.move(ConnectFourPlugin.moves.indexOf(react.emoji.name), msg);

      if (game.getWinner() || game.getTie()) {
        collector.stop();
        return;
      }

      await react.users.remove(user);
    });

    collector.on('end', () => {
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

  private currentPlayer: number = -1;

  private winner: Maybe<number> = null;
  private tie: boolean = false;

  private _searchDX: number[] = [-1, -1, 0, 1, 1, 1, 0, -1];
  private _searchDY: number[] = [0, -1, -1, -1, 0, 1, 1, 1];

  constructor(playerA: User, playerB: User) {
    this._playerA = playerA;
    this._playerB = playerB;

    this._board = Array.from(Array(this._rows), (_) => Array(this._cols).fill(0));
  }

  public getCurrentPlayer() {
    return this.currentPlayer === -1 ? this._playerA : this._playerB;
  }

  public getWinner() {
    return this.winner;
  }

  public getTie() {
    return this.tie;
  }

  public async move(col: number, msg: IMessage) {
    // Make move.
    const successfulDrop: boolean = this.dropPiece(col);
    if (!successfulDrop) {
      return;
    }

    // Check for win.
    if (this.checkWin()) {
      this.winner = this.currentPlayer;
    } else {
      if (this.checkTie()) {
        this.tie = true;
      }
    }

    // Change players.
    this.currentPlayer *= -1;

    await msg.edit(this.showBoard());

    return;
  }

  public dropPiece(col: number): boolean {
    // Make
    let row = 0;
    while (row < this._rows && this._board[row][col] === 0) {
      row++;
    }
    row--;

    if (row === -1) {
      return false;
    }

    this._board[row][col] = this.currentPlayer;

    return true;
  }

  public checkWin(): boolean {
    // Returns if a postion is valid and owned by the current player.
    const validAndOwned: (arg0: number, arg1: number) => boolean = (row, col) => {
      return (
        row >= 0 &&
        row < this._rows &&
        col >= 0 &&
        col < this._cols &&
        this._board[row][col] === this.currentPlayer
      );
    };

    const chainOfFourInAnyDirection: (arg0: number, arg1: number) => boolean = (row, col) => {
      const chains: number[] = Array(8).fill(0);

      // For all locations in chain of length four
      for (let distance = 0; distance < 4; distance++) {
        // For each possible chain direction
        for (let direction = 0; direction < 8; direction++) {
          const newRow: number = row + this._searchDY[direction] * distance;
          const newCol: number = col + this._searchDX[direction] * distance;

          if (validAndOwned(newRow, newCol)) {
            chains[direction]++;
          }
        }
      }

      // Return whether or not we found a chain of four.
      return chains.includes(4);
    };

    // For every location in the board, evaluate if it is part of a winning chain or not.
    return this._board.some((rowObj, rowIdx) => {
      return rowObj.some((_, colIdx) => {
        return chainOfFourInAnyDirection(rowIdx, colIdx);
      });
    });
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

    //
    const boardAsString = [
      ...this._board.map((row) =>
        wrapBackground(row.map((col) => this._flagToEmoji[col]).join(''))
      ),
      Array(this._cols + 2)
        .fill(this._background)
        .join(''),
    ].join('\n');

    const bottomRow = wrapBackground(ConnectFourPlugin.moves.join(''));

    const playerA =
      this.getCurrentPlayer() === this._playerA
        ? bold(this._playerA.username)
        : this._playerA.username;
    const playerB =
      this.getCurrentPlayer() === this._playerB
        ? bold(this._playerB.username)
        : this._playerB.username;

    const turnMessage = `${playerA} vs ${playerB}`;
    const winnerMessage = `🎉 Game over!! ${
      this.winner === -1 ? bold(playerA) : bold(playerB)
    } wins! 🎉`;
    const tieMessage = 'Uh oh, looks like it was a draw :(';

    const result = this.winner ? winnerMessage : this.tie ? tieMessage : turnMessage;
    const fullMessage = [boardAsString, bottomRow, result].join('\n');

    const embed = new MessageEmbed();
    embed.setTitle('Connect Four');
    embed.setDescription(fullMessage);

    return embed;
  }
}
