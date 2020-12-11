import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';
import { RichEmbed, Message } from 'discord.js';

class Game {
  public gameNumber: number = -1;
  public visitorName: string = '';
  public homeName: string = '';
  public visitorScore: number = -1;
  public homeScore: number = -1;
  public inProgress: boolean = false;
  public time: string = '';
}

export class ScoresPlugin extends Plugin {
  public name: string = 'Scores Plugin';
  public description: string = 'Gets the score of a sporting event';
  public usage: string = 'scores <sport> <team>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Sports;

  private _ENDPOINTS = new Map([
    ['ncaa', 'http://www.espn.com/college-football/bottomline/scores'],
    ['nfl', 'http://www.espn.com/nfl/bottomline/scores'],
    ['mlb', 'http://www.espn.com/mlb/bottomline/scores'],
    ['nba', 'http://www.espn.com/nba/bottomline/scores'],
  ]);
  private _WINNING_STRINGS: string[] = ['won against', 'lost to', 'tied with'];
  private _GAME_DELIMITER: string = 'left';
  private _EXTRA_NAME_DELIMITER: RegExp = /%2[0-9]{1}/g;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args;
  }

  public async execute(message: IMessage, args: string[]) {
    //Default is ucf if no args
    if (!args.length) {
      const game = await this._getGame(message, 'ncaa', 'ucf');
      if (game.gameNumber !== -1) {
        this._sendEmbed(message, game);
      }
      return;
    }

    const [sport, ...team] = args;
    if (team.join(' ') === 'list') {
      this._listGames(message, sport);
      return;
    }

    const game = await this._getGame(message, sport.toLowerCase(), team.join(' ').toLowerCase());
    if (game.gameNumber === -1) {
      return;
    }

    this._sendEmbed(message, game);
  }

  private async _listGames(message: IMessage, sport: string): Promise<void> {
    const games = await this._parseGames(message, sport);
    const buffer = [];

    let embed = new RichEmbed();
    embed.title = `List ${sport.toUpperCase()} games`;

    let total = 0;
    games.forEach((game) => {
      if (game.gameNumber === -1) {
        return;
      }

      embed.addField(`${game.visitorName}`, `${game.homeName}`, true);
      total++;
      if (total + 1 == 25) {
        total = 0;
        buffer.push(embed);
        embed = new RichEmbed();
        embed.title = `List ${sport.toUpperCase()} games`;
      }
    });

    buffer.push(embed); //Push final embed;
    const promises = buffer.reduce((acc: Promise<Message>[], embed: Message) => {
      acc.push(message.channel.send(embed));
      return acc;
    }, []);
    await Promise.all(promises);
  }

  private async _getGame(message: IMessage, sport: string, targetTeam: string): Promise<Game> {
    const games: Game[] = await this._parseGames(message, sport);
    if (games[0].gameNumber === -1) {
      return new Game();
    }

    const [targetGame] = games.filter((game) =>
      [game.visitorName, game.homeName]
        .map((e) => e.toLowerCase().replace(/([0-9]{1-2}) /, '')) //Remove rank from name
        .some((name) => name === targetTeam)
    );

    if (!targetGame) {
      await message.reply('Team could not be found.');
      return new Game();
    }

    return targetGame;
  }

  private async _parseGames(message: IMessage, sport: string): Promise<Game[]> {
    const data: string = await this._getResponse(message, sport);
    if (!data) {
      return [new Game()];
    }

    const games: Game[] = data
      .split(this._GAME_DELIMITER)
      .slice(1) //First element is useless
      .reduce((acc: Game[], gameData: string) => {
        acc.push(this._resolveToGame(gameData));
        return acc;
      }, []);
    return games;
  }

  private async _getResponse(message: IMessage, sport: string): Promise<string> {
    const url = this._ENDPOINTS.get(sport);
    if (!url) {
      message.reply('Unable to locate sport.');
      return '';
    }
    const response = await this.container.httpService.get(url);
    return this._decode(response.data);
  }

  private _decode(data: string): string {
    return data.replace(/%20/g, ' ').replace(/%26/g, '&');
  }

  private _resolveToGame(data: string): Game {
    let game;
    if (data.includes('CANCELLED') || data.includes('DELAYED')) {
      game = this._parseCancelledGame(data);
    }
    if (data.includes(' at ')) {
      game = this._parseUpcomingGame(data);
    }
    if (data.includes('FINAL')) {
      game = this._parseFinishedGame(data);
    }
    if (data.includes(' IN ') || data.includes('HALFTIME')) {
      game = this._parseInProgressGame(data);
    }

    if (!game) {
      game = new Game();
    }

    //For some reason a few teams names' are seperated by a different delimiter
    game.visitorName = game.visitorName.replace(this._EXTRA_NAME_DELIMITER, ' ');
    game.homeName = game.homeName.replace(this._EXTRA_NAME_DELIMITER, ' ');

    return game;
  }

  private _parseInProgressGame(data: string): Game {
    const [gameNumber, gameInfo] = data.split('=');
    const [visitorData, homeInfo] = gameInfo.split('   ');
    const [homeData, timeInfo] = homeInfo.split(' (');
    const [time] = timeInfo.split(')');

    let temp = visitorData.split(' ');
    const [visitorScore, ...visitorName] = [temp.pop(), ...temp];
    temp = homeData.split(' ');
    const [homeScore, ...homeName] = [temp.pop(), ...temp];

    const game = new Game();
    game.gameNumber = parseInt(gameNumber);

    game.visitorName = visitorName.join(' ');
    game.visitorScore = parseInt(<string>visitorScore);

    game.homeName = homeName.join(' ');
    game.homeScore = parseInt(<string>homeScore);

    game.time = time;
    game.inProgress = true;
    return game;
  }

  //Sample of data
  //54=Washington State 13   ^(16) USC 38 (FINAL)&ncf_s_right54_count=0&ncf_s_url54=http://espn.go.com/ncf/boxscore?gameId=401249427&ncf_s_loaded=true
  //Everything after the Time Is garbage
  private _parseFinishedGame(data: string): Game {
    const [gameNumber, gameInfo] = data.split('=');
    const [visitorData, homeInfo] = gameInfo.split('   ');
    const [homeData] = homeInfo.split(' (');

    /*Score is the last element
    The rest is the name*/
    let temp = visitorData.split(' ');
    const [visitorScore, ...visitorName] = [temp.pop(), ...temp];
    temp = homeData.split(' ');
    const [homeScore, ...homeName] = [temp.pop(), ...temp];

    const game = new Game();
    game.gameNumber = parseInt(gameNumber);
    game.visitorName = visitorName.join(' ').replace('^', ''); //^ indicates that this team won
    game.visitorScore = parseInt(<string>visitorScore);

    game.homeName = homeName.join(' ').replace('^', '');
    game.homeScore = parseInt(<string>homeScore);
    game.time = 'Final';

    return game;
  }

  private _parseUpcomingGame(data: string): Game {
    const [gameNumber, gameInfo] = data.split('=');
    const [visitorTeam, homeInfo] = gameInfo.split('% at ');
    const [homeTeam, timeinfo] = homeInfo.split(' (');
    const [time] = timeinfo.split(')');

    const game = new Game();
    game.gameNumber = parseInt(gameNumber);
    game.visitorName = visitorTeam;
    game.homeName = homeTeam;
    game.time = time;

    return game;
  }

  private _parseCancelledGame(data: string): Game {
    const [gameNumber, gameInfo] = data.split('=');
    const [vistorTeam, homeInfo] = gameInfo.split(' 0   ');
    const [homeTeam, timeInfo] = homeInfo.split(' 0 (');
    const [time] = timeInfo.split(')');

    const game = new Game();
    game.gameNumber = parseInt(gameNumber);
    game.visitorName = vistorTeam;
    game.homeName = homeTeam;
    game.time = time.charAt(0) + time.slice(1).toLowerCase(); //keep first letter capitalized

    return game;
  }

  private _sendEmbed(message: IMessage, game: Game): void {
    let embed = new RichEmbed();
    embed.title = `${game.visitorName} at ${game.homeName}`;
    embed.setColor('#7289da');

    if (game.time === 'Cancelled' || game.time === 'Delayed') {
      embed = this._createCancelledEmbed(game, embed);
    } else if (game.time === 'Final') {
      embed = this._createFinishedEmbed(game, embed);
    } else if (game.inProgress) {
      embed = this._createInProgressEmbed(game, embed);
    } else {
      embed = this._createUpcomingEmbed(game, embed);
    }
    message.channel.send(embed);
  }

  private _createUpcomingEmbed(game: Game, embed: RichEmbed): RichEmbed {
    embed.setDescription(`${game.visitorName} will face off at ${game.homeName}`);
    embed.setFooter(`${game.time}`);
    return embed;
  }

  private _createCancelledEmbed(game: Game, embed: RichEmbed): RichEmbed {
    embed.setDescription(`${game.visitorName} at ${game.homeName} has been ${game.time}.`);
    return embed;
  }

  private _createFinishedEmbed(game: Game, embed: RichEmbed): RichEmbed {
    let winningString: string = '';
    if (game.visitorScore > game.homeScore) {
      winningString = this._WINNING_STRINGS[0];
    } else if (game.visitorScore < game.homeScore) {
      winningString = this._WINNING_STRINGS[1];
    } else {
      winningString = this._WINNING_STRINGS[2];
    }
    embed.setDescription(`${game.visitorName} ${winningString} ${game.homeName}`);
    embed.setFooter(`${game.visitorScore} - ${game.homeScore}`);
    return embed;
  }

  private _createInProgressEmbed(game: Game, embed: RichEmbed): RichEmbed {
    let winningString: string = '';
    if (game.visitorScore > game.homeScore) {
      winningString = 'winning';
    } else if (game.visitorScore < game.homeScore) {
      winningString = 'losing';
    } else {
      winningString = 'tied';
    }
    embed.setDescription(
      `${game.visitorName} is currently ${winningString} against ${game.homeName}`
    );
    embed.setFooter(`${game.visitorScore} - ${game.homeScore} | ${game.time}`);
    return embed;
  }
}
