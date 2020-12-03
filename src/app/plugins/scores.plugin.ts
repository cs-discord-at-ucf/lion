import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';
import { RichEmbed } from 'discord.js';

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
  private _GAME_DELIMITER: string = 'left';

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
    buffer.forEach((embed) => message.channel.send(embed));
  }

  private async _getGame(message: IMessage, sport: string, targetTeam: string): Promise<Game> {
    const games: Game[] = await this._parseGames(message, sport);

    const [targetGame] = games.filter((game) =>
      [game.visitorName, game.homeName]
        .map((e) => e.toLowerCase().replace(/([0-9]{1-2}) /, '')) //Remove rank from name
        .some((name) => name === targetTeam)
    );

    if (!targetGame) {
      message.reply('Team could not be found.');
      return new Game();
    }

    return targetGame;
  }

  private async _parseGames(message: IMessage, sport: string): Promise<Game[]> {
    const data: string = await this._getResponse(message, sport);
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
    return (await this.container.httpService.get(url)).data;
  }

  private _resolveToGame(data: string): Game {
    let game;
    if (data.includes('CANCELLED')) {
      game = this._parseCancelledGame(data);
    }

    if (data.includes('%20at%20')) {
      game = this._parseUpcomingGame(data);
    }

    if (!game) {
      game = new Game();
    }

    return game;
  }

  private _parseUpcomingGame(data: string): Game {
    const [gameNumber, gameInfo] = data.split('=');
    const [visitorTeam, homeInfo] = gameInfo.split('%20at%20');
    const [homeTeam, timeinfo] = homeInfo.split('%20(');
    const [time] = timeinfo.split(')');

    const game = new Game();
    game.gameNumber = parseInt(gameNumber);
    game.visitorName = visitorTeam.replace(/%2[0-9]/g, ' ');
    game.homeName = homeTeam.replace(/%2[0-9]/g, ' ');
    game.time = time.replace(/%20/g, ' ');

    return game;
  }

  private _parseCancelledGame(data: string): Game {
    const [gameNumber, gameInfo] = data.split('=');
    const [vistorTeam, homeInfo] = gameInfo.split('%200%20%20%20');
    const [homeTeam] = homeInfo.split('%200%20');

    const game = new Game();
    game.gameNumber = parseInt(gameNumber);
    game.visitorName = vistorTeam.replace(/%20/g, ' ');
    game.homeName = homeTeam.replace(/%20/g, ' ');
    game.time = 'Cancelled';

    return game;
  }

  private _sendEmbed(message: IMessage, game: Game): void {
    const embed = new RichEmbed();
    embed.title = `${game.visitorName} at ${game.homeName}`;
    embed.setColor('#7289da');
    if (game.time === 'Cancelled') {
      message.channel.send(this._createCancelledEmbed(game, embed));
      return;
    }
    if (!game.inProgress) {
      message.channel.send(this._createUpcomingEmbed(game, embed));
      return;
    }
  }

  private _createUpcomingEmbed(game: Game, embed: RichEmbed): RichEmbed {
    embed.setDescription(`${game.visitorName} will face off at ${game.homeName}`);
    embed.setFooter(`${game.time}`);
    return embed;
  }

  private _createCancelledEmbed(game: Game, embed: RichEmbed): RichEmbed {
    embed.setDescription(`${game.visitorName} at ${game.homeName} has been cancelled.`);
    return embed;
  }
}
