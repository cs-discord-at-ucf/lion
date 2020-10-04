import { RichEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import Constants from '../../common/constants';
import { IContainer, IMessage, ChannelType } from '../../common/types';

// const Discord = require('discord.js');

export class NCAAScoresPlugin extends Plugin {
  public name: string = 'Scores Plugin';
  public description: string = 'Gets score of a football game.';
  public usage: string = '';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Sports;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const endpoint = 'http://www.espn.com/college-football/bottomline/scores';
    let desiredTeamQuery = this._parseTeam(args || []);

    //If no args, team is UCF by default
    if (desiredTeamQuery === '') {
      desiredTeamQuery = 'UCF';
    }


    try {
      const response = await this.container.httpService.get(endpoint);
      const games = response.data.split('?'); //Each game ends with a ?


      let teamFound = false;
      for (const game of games) {
        if (this._containsAllTokens(game, desiredTeamQuery.split(' '))) {
          teamFound = true;

          const visitorDataRegex = '[=\\\^][a-zA-Z0(%20)]+%20[0-9]+'; //Isolates visiting team's data
          const homeDataRegex = '%20%20\\\^?(\\\(\\\d+\\\))?[a-zA-Z(%20)]+%20[0-9]+'; //Isolates home team's data
          const nameRegex = '[a-zA-Z]+' //Extracts the name from the data


          let visitorData = game.match(visitorDataRegex)[0];
          let homeData = game.match(homeDataRegex)[0];

          visitorData = visitorData.split("%20");
          homeData = homeData.split("%20");

          visitorData[0] = visitorData[0].slice(1); //Remove the prefix that starts the visitors name


          const visitorName = this._getTeamNameFromTeamData(visitorData);
          const homeName = this._getTeamNameFromTeamData(homeData);

          const visitorScore = visitorData[visitorData.length - 1];
          const homeScore = homeData[homeData.length - 1];

          //Boolean for if the searched team is the one winning
          let winning = false;
          let opponentName = '';
          let teamName = '';

          //If searched team is the visitor, else
          if (this._containsAllTokens(visitorName, desiredTeamQuery.split(' '))) {
            winning = visitorScore > homeScore;
            opponentName = homeName;
            teamName = visitorName;
          } else {
            winning = homeScore > visitorScore;
            opponentName = visitorName;
            teamName = homeName;
          }

          const winningString = winning ? "winning" : "losing";

          const embed = new RichEmbed();
          embed.setTitle(visitorName + " at " + homeName);
          embed.setColor('#7289da');
          embed.setDescription(teamName + " is currently " + winningString + " against " + opponentName);
          embed.setFooter(visitorScore + " - " + homeScore);

          message.channel.send(embed);

        }
      }

      if (!teamFound)
        message.reply("Team not found!");

    } catch (error) {
      console.log('Error Occured: ' + error);
    }
  }


  private _getTeamNameFromTeamData(arr: string[]): string {

    let name = ''
    for (let i = 0; i < arr.length - 1; i++)
      name += arr[i] + ' ';


    //Trim whitespace
    while (name[0] == ' ' || name[0] == '^')
      name = name.slice(1);

    return name;
  }


  private _containsAllTokens(string: string, tokens: string[]): boolean {

    //Return false if one of the tokens in not in string
    for (const token of tokens)
      if (!string.toLowerCase().includes(token.toLowerCase()))
        return false;

    return true;

  }

  private _parseTeam(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}