import { RichEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import Constants from '../../common/constants';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class ScoresPlugin extends Plugin {
  public name: string = 'NCAA Scores Plugin';
  public description: string = 'Gets score of a football game.';
  public usage: string = 'scores <sport> <team name>; ex scores NCAA UCF';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Sports;

  private _ENDPOINTS = new Map([
    ['ncaa', 'http://www.espn.com/college-football/bottomline/scores'],
    ['nfl', 'http://www.espn.com/nfl/bottomline/scores'],
    ['mlb', 'http://www.espn.com/mlb/bottomline/scores'],
    ['nba', 'http://www.espn.com/nba/bottomline/scores']
  ]);

  private _WINNING_LABELS = ['losing', 'winning', 'tied'];
  private _MAX_NUM_DISPLAY: number = 3;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const parsedArgs = (args || []).map((str) => str.toLowerCase()).join(' ');
    let teamArg;
    let sportArg;

    //If no args, team is UCF by default
    if (parsedArgs === '') {
      sportArg = 'NCAA';
      teamArg = 'UCF';
    } else {

      let argArray = parsedArgs.split(' ');
      if (argArray.length < 2) {               //Make sure there are 2 arguments given
        message.reply("Incorrect Amount of Arguments");
        return;
      }
      sportArg = argArray[0];

      argArray = argArray.slice(1);
      teamArg = argArray.join(' ');
    }

    const endpoint = this._ENDPOINTS.get(sportArg.toLowerCase());
    if (endpoint == null) {
      message.reply("Error locating sport");
      return;
    }

    const visitorDataRegex: RegExp = /[=\^][a-zA-Z]+%20([a-zA-Z]*%20)?[0-9]+/; //Isolates visiting team's data
    const homeDataRegex: RegExp = /(?<=%20%20)\^?(\(\d+\))?[a-zA-Z(%20)]+%20[0-9]+/; //Isolates home team's data

    try {
      const response = await this.container.httpService.get(endpoint);
      const games = response.data.split('?'); //Each game ends with a ?

      const embedBuffer = [];
      let teamFound = false;

      for (const game of games) {

        if (!this._containsAllTokens(game, teamArg.split(' '))) { continue; } //Check if game does not contain all search terms
        if (embedBuffer.length >= this._MAX_NUM_DISPLAY) { break; } //Stop if the max amount of messages have been queued

        teamFound = true; //Designates as true if any game was found with matching search term

        let visitorData = game.match(visitorDataRegex);
        let homeData = game.match(homeDataRegex);

        //Makes sure regex found data
        if (visitorData == null || homeData == null) { continue; }

        visitorData = visitorData[0];
        homeData = homeData[0];

        visitorData = visitorData.split('%20');
        homeData = homeData.split('%20');

        visitorData[0] = visitorData[0].slice(1); //Remove the prefix that starts the visitors name

        const visitorName = this._getTeamNameFromTeamData(visitorData);
        const homeName = this._getTeamNameFromTeamData(homeData);

        const visitorScore = parseInt(visitorData[visitorData.length - 1]);
        const homeScore = parseInt(homeData[homeData.length - 1]);

        //Boolean for if the searched team is the one winning
        let winning = 0;
        let opponentName = '';
        let teamName = '';

        //If searched team is the visitor, else
        if (this._containsAllTokens(visitorName, teamArg.split(' '))) {

          if (visitorScore > homeScore) { winning = 1; }  //Winning
          else if (visitorScore < homeScore) { winning = 0; } //Losing
          else if (visitorScore == homeScore) { winning = 2; } //Tied

          opponentName = homeName;
          teamName = visitorName;
        } else {

          if (homeScore > visitorScore) { winning = 1; }  //Winning
          else if (homeScore < visitorScore) { winning = 0; } //Losing
          else if (homeScore == visitorScore) { winning = 2; } //Tied

          opponentName = visitorName;
          teamName = homeName;
        }

        const winningString = this._WINNING_LABELS[winning];

        const embed = new RichEmbed();
        embed.setTitle(visitorName + ' at ' + homeName);
        embed.setColor('#7289da');
        embed.setDescription(
          teamName + ' is currently ' + winningString + ' against ' + opponentName
        );
        embed.setFooter(visitorScore + ' - ' + homeScore);
        embedBuffer.push(embed);

      }

      //Send embeds in buffer
      embedBuffer.forEach(e => {
        message.channel.send(e)
      });

      if (!teamFound) { message.reply('Team not found!'); }

    } catch (error) {
      this.container.loggerService.error(error);
    }
  }

  private _getTeamNameFromTeamData(arr: string[]): string {
    let name = arr.slice(0, arr.length - 1).join(' '); //Last element is team score

    //Trim whitespace and special characters
    name = name.trim().replace(/\^/, '');

    return name;
  }

  private _containsAllTokens(str: string, tokens: string[]): boolean {
    //Return false if one of the tokens in not in string
    const sl = str.toLowerCase();
    return tokens.map(t => t.toLowerCase()).every(t => sl.includes(t));
  }

}
