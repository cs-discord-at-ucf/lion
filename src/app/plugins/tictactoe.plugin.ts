import { MessageEmbed, User } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class TicTacToe extends Plugin {
  public name: string = 'Tic Tac Toe';
  public description: string = 'Tic Tac Toe';
  public usage: string = 'TicTacToe';
  public pluginAlias = ['ttt'];
  public permission: ChannelType = ChannelType.Public;

  private _games: TTTGame[] = [];
  private _flagToEmoji: Record<number, string> = {
    [-1]: '🟦',
    [0]: ':regional_indicator_o:',
    [1]: ':regional_indicator_x:',
  };

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
    this._games.push(game);

    const msg = await message.reply(this._showBoard(game));
    Constants.NumbersAsEmojis.forEach((r) => msg.react(r));
    return;
  }

  private _showBoard(game: TTTGame) {
    const boardAsString = game.board
      //Convert each element of each row into an emoji
      //Join each column with a space, each row with a newline
      .map((row) => row.map((col) => this._flagToEmoji[col]).join(' '))
      .join('\n');

    const embed = new MessageEmbed();
    embed.setTitle('Tic Tac Toe');
    embed.setFooter(`${game.playerA.username} vs ${game.playerB.username}`);
    embed.setDescription(boardAsString);
    return embed;
  }
}

class TTTGame {
  public playerA: User;
  public playerB: User;
  public board: number[][];

  constructor(playerA: User, playerB: User) {
    this.playerA = playerA;
    this.playerB = playerB;

    //Make 3x3 board of -1
    this.board = new Array(3).fill(new Array(3).fill(-1));
  }
}
