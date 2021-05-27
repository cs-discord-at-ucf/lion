import { MessageEmbed, MessageReaction, User } from 'discord.js';
import moment from 'moment';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';

export class TicTacToe extends Plugin {
  public name: string = 'Tic Tac Toe';
  public description: string = 'Tic Tac Toe';
  public usage: string = 'TicTacToe';
  public pluginAlias = ['ttt'];
  public permission: ChannelType = ChannelType.Public;
  private _moves: string[] = ['1️⃣', '2️⃣', '3️⃣', '🔄'];

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length > 1;
  }

  public async execute(message: IMessage, args: string[]) {
    const [subCommand, ...subArgs] = args;

    if (subCommand.toLowerCase() === 'create') {
      const [...opponent] = subArgs;
      await this._createGame(message, opponent.join(' '));
    }
  }

  private async _createGame(message: IMessage, opponent: string) {
    const guild = message.guild;
    if (!guild) {
      return;
    }

    const oppMember = guild.members.cache.filter((m) => m.user.tag === opponent).first();
    if (!oppMember) {
      return message.reply('Could not find a user with that name.');
    }

    const game = new TTTGame(message.author, oppMember.user);
    const msg = await message.reply(game.showBoard());
    await Promise.all(this._moves.map((emoji) => msg.react(emoji)));

    //Create reactions for making moves
    const collector = msg.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        //Assert one of target emojis and not the bot
        this._moves.includes(reaction.emoji.name) && user.id !== msg.author.id,
      {
        time: moment.duration(10, 'minutes').asMilliseconds(),
      }
    );

    collector.on('collect', async (reaction: MessageReaction) => {
      //Last person to react
      const user = reaction.users.cache.last();
      if (user !== game.getCurrentPlayer()) {
        //Not one of the players
        await reaction.users.remove(user);
        return;
      }

      const index = this._moves.indexOf(reaction.emoji.name);
      if (index === this._moves.indexOf('🔄')) {
        game.reset();
        await reaction.users.remove(user);
        return;
      }

      await game.choose(index, msg);
      await reaction.users.remove(user);
    });
  }
}

class TTTGame {
  public playerA: User;
  public playerB: User;
  public board: number[][];

  private _flagToEmoji: Record<number, string> = {
    [-1]: ':regional_indicator_o:',
    [0]: '🟦',
    [1]: ':regional_indicator_x:',
  };

  //-1 is column, 1 is row
  public choosingRow: boolean = true;
  private row = -1;
  private col = -1;
  private _winner: Maybe<number> = null;

  //-1 is playerA
  private currentPlayer: number = -1;

  constructor(playerA: User, playerB: User) {
    this.playerA = playerA;
    this.playerB = playerB;

    //Make 3x3 board of 0
    this.board = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
  }

  showBoard() {
    const boardAsString = this.board
      //Convert each element of each row into an emoji
      //Join each column with a space, each row with a newline
      .map((row) => row.map((col) => this._flagToEmoji[col]).join(' '))
      .join('\n');

    const embed = new MessageEmbed();
    embed.setTitle('Tic Tac Toe');
    embed.setDescription(boardAsString);

    if (this._winner) {
      embed.setDescription(
        `${boardAsString}\n**` +
          `${this._winner === -1 ? this.playerA.username : this.playerB.username}** is the winner!`
      );
      return embed;
    }

    const bold = (s: string) => {
      return `**${s}**`;
    };

    const playerATitle =
      this.currentPlayer === -1 ? bold(this.playerA.username) : this.playerA.username;

    const playerBTitle =
      this.currentPlayer === 1 ? bold(this.playerB.username) : this.playerB.username;

    embed.setDescription(`${boardAsString}\n${playerATitle} vs ${playerBTitle}`);
    return embed;
  }

  getCurrentPlayer() {
    if (this.currentPlayer === -1) {
      return this.playerA;
    }
    return this.playerB;
  }

  flipTurn() {
    this.currentPlayer *= -1;
  }

  reset() {
    this.choosingRow = true;
    this.row = -1;
    this.col = -1;
  }

  private checkWin() {
    let flag = false;
    this.board.forEach((row) => {
      //If the sum of the row is 3, someone has won
      if (Math.abs(this.sumArray(row)) === 3) {
        flag = true;
      }
    });

    for (let i = 0; i < 3; i++) {
      //Get the column
      const col = [];
      for (let j = 0; j < 3; j++) {
        col.push(this.board[j][i]);
      }

      if (Math.abs(this.sumArray(col)) === 3) {
        flag = true;
      }
    }

    //Check diagonals
    let sumA = 0;
    let sumB = 0;
    for (let i = 0; i < 3; i++) {
      sumA += this.board[i][i];
    }

    for (let i = 0; i < 3; i++) {
      sumB += this.board[i][i];
    }

    if (Math.abs(sumA) === 3 || Math.abs(sumB) === 3) {
      flag = true;
    }

    return flag;
  }

  private sumArray(arr: number[]) {
    return arr.reduce((acc, val) => acc + val);
  }

  async choose(index: number, msg: IMessage) {
    if (this.choosingRow) {
      this.row = index;
      this.choosingRow = false;
      return;
    }

    this.col = index;

    //Make the move

    //Make sure its not overwriting
    if (this.board[this.col][this.row] !== 0) {
      this.reset();
      return;
    }

    this.board[this.col][this.row] = this.currentPlayer;

    if (this.checkWin()) {
      this._winner = this.currentPlayer;
    }

    this.checkTie();

    this.currentPlayer *= -1;
    await msg.edit(this.showBoard());
    //Reset where the player is choosing
    this.reset();
  }

  checkTie() {
    const flag = false;
  }
}
