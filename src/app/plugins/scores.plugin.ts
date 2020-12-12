import { Plugin } from '../../common/plugin';
import Constants from '../../common/constants';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { RichEmbed } from 'discord.js';
import * as espn from '../plugins/espn';

export class ScoresPlugin extends Plugin {
  public name: string = 'NCAA Scores Plugin';
  public description: string = 'Gets score of a sport game.';
  public usage: string = 'scores <sport> <team origin>; ex scores NCAA UCF';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Sports;

  private _ENDPOINTS = new Map([
    ['ncaa', 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'],
    ['nfl', 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'],
    ['mlb', 'http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard'],
    ['nba', 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'],
  ]);

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length >= 2;
  }

  public async execute(message: IMessage, args: string[]) {
    const [sport, ...team] = args;
    const url = this._ENDPOINTS.get(sport.toLowerCase());

    if (!url) {
      await message.reply('Could not locate sport.');
      return;
    }

    const game = await this._getGame(url, team.join(' ').toLowerCase());

    if (!game) {
      await message.reply('Team not found.');
      return;
    }

    const isVisitor: boolean = this._getIsVisitor(game, team.join(' ').toLowerCase());
    await this._sendEmbed(message, game, isVisitor);
  }

  private async _getGame(url: string, teamName: string): Promise<espn.Event> {
    const games = await this._getGames(url);
    const targetGame = games.filter((game) =>
      game.competitions[0].competitors.some(
        (competitor: espn.Competitor) =>
          competitor.team.location.toLowerCase() === teamName ||
          competitor.team.abbreviation.toLocaleLowerCase() === teamName ||
          competitor.team.name.toLowerCase() == teamName
      )
    );

    return targetGame[0]; //There should theoretically be match
  }

  private async _getGames(url: string): Promise<espn.Event[]> {
    const response = (await this.container.httpService.get(url)).data;
    const responseData: espn.Sample = (response as Object) as espn.Sample;
    return responseData.events;
  }

  private _getIsVisitor(game: espn.Event, teamName: string): boolean {
    const visitorTeam: espn.Team = game.competitions[0].competitors[0].team;
    return (
      visitorTeam.location.toLowerCase() === teamName ||
      visitorTeam.abbreviation.toLowerCase() === teamName ||
      visitorTeam.name.toLowerCase() === teamName
    );
  }

  private async _sendEmbed(message: IMessage, game: espn.Event, isVisitor: boolean) {
    const embed = this._createEmbed(game, isVisitor);
    await message.channel.send(embed);
  }

  private _createEmbed(game: espn.Event, isVisitor: boolean) {
    console.log(game);

    const embed = new RichEmbed();
    embed.title = game.name;
    embed.setURL(game.links[0].href);

    const visTeam = game.competitions[0].competitors[0];
    const homeTeam = game.competitions[0].competitors[1];
    const logo = isVisitor ? visTeam.team.logo : homeTeam.team.logo;
    const color = isVisitor ? visTeam.team.color : homeTeam.team.color;
    embed.setThumbnail(logo);
    embed.setColor(color);

    if (game.status.type.state === 'pre') {
      embed.addField('Date', `${game.status.type.detail}`, false);
    } else {
      const visitorScore = visTeam.score;
      const homeScore = homeTeam.score;
      embed.addField('Score', `${visitorScore} - ${homeScore}`, false);
    }

    game.competitions[0].competitors.forEach((team) => {
      let teamStats = '';
      if (team.curatedRank) {
        const rank = team.curatedRank.current;
        teamStats += `*Rank:* ${rank === 99 ? 'Unranked' : rank}`;
      }

      teamStats += `\n*Overall:* ${team.records[0].summary}`;
      teamStats += `\n*Home:* ${team.records[1].summary}`;
      teamStats += `\n*Away:* ${team.records[2].summary}`;

      embed.addField(`${team.team.abbreviation}`, teamStats, true);
    });

    if (game.weather) {
      embed.addField(
        'Weather',
        `*Precipitation:* ${game.weather.displayValue}\n*High:* ${game.weather.highTemperature ||
          game.weather.temperature} degrees`,
        true
      );
    }

    return embed;
  }
}
