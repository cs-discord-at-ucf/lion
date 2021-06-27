import { Plugin } from '../../common/plugin';
import Constants from '../../common/constants';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';
import * as espn from '../__generated__/espn';

export default class ScoresPlugin extends Plugin {
  public commandName: string = 'scores';
  public name: string = 'NCAA Scores Plugin';
  public description: string = 'Gets score of a sport game.';
  public usage: string = 'scores <sport> <team origin>; ex scores NCAA UCF';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Sports;
  public commandPattern: RegExp = /(ncaa|nfl|mlb|nba)\s(\w+\s?)+/;

  private _ENDPOINTS = new Map([
    ['ncaa', 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'],
    ['nfl', 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'],
    ['mlb', 'http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard'],
    ['nba', 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'],
  ]);

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [sport, ...teamArg] = args;
    const url = this._ENDPOINTS.get(sport.toLowerCase());

    if (!url) {
      await message.reply('Could not locate sport.');
      return;
    }

    const teamName = teamArg.join(' ').toLowerCase();
    const game = await this._getGame(url, teamName);

    if (!game) {
      await message.reply('Team not found.');
      return;
    }

    if (game.competitions[0].competitors.length < 2) {
      await message.reply('There was an error getting the game info.');
      return;
    }

    const visitorTeam = game.competitions[0].competitors[1].team;
    const isVisitor: boolean =
      visitorTeam.location.toLowerCase() === teamName ||
      visitorTeam.abbreviation.toLowerCase() === teamName ||
      visitorTeam.name.toLowerCase() === teamName;
    await message.channel.send({ embeds: [this._createEmbed(game, isVisitor)] });
  }

  private async _getGame(url: string, teamName: string): Promise<espn.IEvent> {
    const games = await this._getGames(url);
    const targetGame = games
      .filter((game) => game.competitions.length)
      .filter((game) =>
        game.competitions[0].competitors.some(
          (competitor: espn.ICompetitor) =>
            competitor.team.location.toLowerCase() === teamName ||
            competitor.team.abbreviation.toLowerCase() === teamName ||
            competitor.team.name?.toLowerCase() === teamName // There is an NFL team without a 'name' AKA mascot
        )
      );

    return targetGame[0]; // There should theoretically be only 1 match
  }

  private async _getGames(url: string): Promise<espn.IEvent[]> {
    const response = (await this.container.httpService.get(url)).data;
    const responseData: espn.ISample = (response as Object) as espn.ISample;
    return responseData.events;
  }

  private _createEmbed(game: espn.IEvent, isVisitor: boolean) {
    const embed = new MessageEmbed();
    embed.title = game.name;
    embed.setURL(game.links[0].href);

    const visTeam = game.competitions[0].competitors[1];
    const homeTeam = game.competitions[0].competitors[0];
    const logo = isVisitor ? visTeam.team.logo : homeTeam.team.logo;
    const color = isVisitor ? visTeam.team.color : homeTeam.team.color;
    embed.setThumbnail(logo);
    embed.setColor(color);

    if (game.status.type.state === 'pre') {
      embed.addField('Date', `${game.status.type.detail}`, false);
    } else {
      const visitorScore = visTeam.score;
      const homeScore = homeTeam.score;
      embed.addField('Score', `${visitorScore} - ${homeScore}`, true);
      embed.addField('Time', `${game.status.displayClock}`, true);
      embed.addField('Quarter', `${game.status.period}`, true);
    }

    game.competitions[0].competitors.forEach((team) => {
      let teamStats = '';
      if (team.curatedRank) {
        const rank = team.curatedRank.current;
        teamStats += `*Rank:* ${rank === 99 ? 'Unranked' : rank}`;
      }

      if (team.records) {
        teamStats += `\n*Overall:* ${team.records[0].summary}`;
        teamStats += `\n*Home:* ${team.records[1].summary}`;
        teamStats += `\n*Away:* ${team.records[2].summary}`;
      }
      embed.addField(`${team.team.abbreviation}`, teamStats, true);
    });

    const probability = game.competitions[0].situation?.lastPlay.probability;
    if (probability) {
      const chances = [probability.awayWinPercentage, probability.homeWinPercentage];
      embed.addField('Win chance:', `${this._decimalToPercent(chances[isVisitor ? 0 : 1])}%`, true);
    }

    const leaders = game.competitions[0].leaders;
    if (leaders) {
      // Each element is a different category
      // Passing, carry, and rushing
      leaders.forEach((cur) => {
        let output = '';
        output += `${cur.leaders[0].athlete.displayName}\n`;
        output += `${cur.leaders[0].displayValue}\n`;
        embed.addField(`${cur.displayName}`, output, false);
      });
    }

    if (game.weather) {
      embed.addField(
        'Weather',
        `*Precipitation:* ${game.weather.displayValue}\n*High:* ${game.weather.highTemperature ||
          game.weather.temperature} degrees`,
        false
      );
    }

    return embed;
  }

  private _decimalToPercent(dec: number) {
    let percent = dec * 10000;
    percent = Math.floor(percent);
    return percent / 100;
  }
}
