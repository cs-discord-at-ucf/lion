import { MessageEmbed, MessageReaction, User } from 'discord.js';
import moment from 'moment';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

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
        game.undo();
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
  public choosing: number = -1;
  private chosenRow = -1;
  private chosenCol = -1;

  //-1 is playerA
  private currentPlayer: number = -1;

  constructor(playerA: User, playerB: User) {
    this.playerA = playerA;
    this.playerB = playerB;

    //Make 3x3 board of -1
    this.board = new Array(3).fill(new Array(3).fill(0));
  }

  showBoard() {
    const boardAsString = this.board
      //Convert each element of each row into an emoji
      //Join each column with a space, each row with a newline
      .map((row) => row.map((col) => this._flagToEmoji[col]).join(' '))
      .join('\n');

    console.log(this.board);

    const embed = new MessageEmbed();
    embed.setTitle('Tic Tac Toe');
    embed.setFooter(`${this.playerA.username} vs ${this.playerB.username}`);
    embed.setDescription(boardAsString);
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

  undo() {
    this.choosing = -1;
    this.chosenRow = -1;
    this.chosenCol = -1;
  }

  async choose(index: number, msg: IMessage) {
    if (this.choosing === -1) {
      this.chosenRow = index;
      this.choosing = 1;
      return;
    }

    this.chosenCol = index;

    //Reset where the player is choosing

    console.log('Making move');

    //Make the move
    //THERE IS AN ERROR HERE
    this.board[this.chosenRow][this.chosenCol] = this.currentPlayer;

    this.currentPlayer *= -1;
    console.log('showing');

    await msg.edit(this.showBoard());
    this.undo();
  }
}
