import { GuildMember, User } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, Maybe } from '../../common/types';
import { GameType } from '../../services/gameleaderboard.service';

export class LeaderboardPlugin extends Plugin {
  public name: string = 'Leaderboard Plugin';
  public description: string = 'Gets the leaderboards of games';
  public usage: string = 'leaderboard <game (optional)>';
  public pluginAlias = ['lb'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName = Constants.Channels.Public.Games;

  public validate(message: IMessage, args: string[]) {
    return args.length >= 1;
  }

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [gameName, opponentOne, opponentTwo] = args;
    const gameEnum: Maybe<GameType> = this._convertGameNameToEnum(gameName);
    if (!gameEnum) {
      message.reply(`Couldn't find that game`);
      return;
    }

    if (!opponentOne) {
      const embed = await this.container.gameLeaderboardService.createOverallLeaderboardEmbed(
        message.author,
        gameEnum
      );

      message.channel.send(embed);
      return;
    } else if (!opponentTwo) {
      const match = opponentOne.match(/<@!?&?(\d+)>/);
      if (!match) {
        message.reply('Invalid <matchup> argument');
        return;
      }
      const uID = match[1];
      const guild = message.guild;
      if (!guild) {
        return;
      }
      const oppUser = guild.members.cache.get(uID);

      // user could not be found
      if (!oppUser) {
        message.channel.send('User could not be found');
        return;
      }

      const embed = await this.container.gameLeaderboardService.createMatchupLeaderboardEmbed(
        message.author,
        oppUser.user,
        gameEnum
      );

      message.channel.send(embed);
      return;
    } else {
      const matchOne = args[1].match(/<@!?&?(\d+)>/);
      const matchTwo = args[2].match(/<@!?&?(\d+)>/);

      if (!matchOne || !matchTwo) {
        message.reply('Invalid <matchup> argument');
        return;
      }
      const [uIDOne, uIDTwo] = [matchOne[1], matchTwo[1]];
      const guild = message.guild;

      if (!guild) {
        return;
      }

      const oppUserOne = guild.members.cache.get(uIDOne);
      const oppUserTwo = guild.members.cache.get(uIDTwo);

      // user could not be found
      if (!oppUserOne || !oppUserTwo) {
        message.channel.send('User could not be found');
        return;
      }

      const embed = await this.container.gameLeaderboardService.createMatchupLeaderboardEmbed(
        oppUserOne.user,
        oppUserTwo.user,
        gameEnum
      );

      message.channel.send(embed);
      return;
    }
  }

  private _convertGameNameToEnum(gameName: string): Maybe<GameType> {
    if (this.container.gameLeaderboardService.gameAliases[GameType.TicTacToe].includes(gameName)) {
      return GameType.TicTacToe;
    }

    if (
      this.container.gameLeaderboardService.gameAliases[GameType.ConnectFour].includes(gameName)
    ) {
      return GameType.ConnectFour;
    }

    return null;
  }
}
