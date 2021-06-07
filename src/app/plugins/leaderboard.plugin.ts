import { Guild } from 'discord.js';
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

  private readonly _MENTION_REGEX = /<@!?&?(\d+)>/;

  public validate(message: IMessage, args: string[]) {
    return args.length >= 1;
  }

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [gameName, opponentOne, opponentTwo] = args;
    const gameEnum: Maybe<GameType> = this._getGameType(gameName);
    if (!gameEnum) {
      await message.reply(`Couldn't find that game`);
      return;
    }

    const guild = message.guild;
    if (!guild) {
      await message.reply('Please use this command in a guild');
      return;
    }

    // Get default leaderboard if no users are given
    if (!opponentOne) {
      const embed = await this.container.gameLeaderboardService.createOverallLeaderboardEmbed(
        message.author,
        gameEnum
      );

      await message.channel.send(embed);
      return;
    }

    // Give one players leaderboard if no opponent is given
    if (!opponentTwo) {
      const embed = await this._createOpponentPlayerEmbed(message, opponentOne, guild, gameEnum);
      await message.channel.send(embed || 'Error getting leaderboards');
      return;
    }

    const embed = await this._getMatchUpEmbed(message, opponentOne, opponentTwo, guild, gameEnum);
    await message.channel.send(embed || 'Error getting leaderboards');
  }

  private async _createOpponentPlayerEmbed(
    message: IMessage,
    opponent: string,
    guild: Guild,
    gameEnum: GameType
  ) {
    const match = opponent.match(this._MENTION_REGEX);
    if (!match) {
      await message.reply('Invalid <matchup> argument');
      return null;
    }

    // The ID is is the first group of the match
    const [, uID] = match;
    const oppUser = guild.members.cache.get(uID)?.user;

    // user could not be found
    if (!oppUser) {
      await message.channel.send('User could not be found');
      return null;
    }

    return this.container.gameLeaderboardService.createMatchupLeaderboardEmbed(
      message.author,
      oppUser,
      gameEnum
    );
  }

  private _getMatchUpEmbed(
    message: IMessage,
    playerOneString: string,
    playerTwoString: string,
    guild: Guild,
    gameEnum: GameType
  ) {
    const [matchOne, matchTwo] = [playerOneString, playerTwoString].map((p) =>
      p.match(this._MENTION_REGEX)
    );

    if (!matchOne || !matchTwo) {
      message.reply('Invalid <matchup> argument');
      return null;
    }
    const [uIDOne, uIDTwo] = [matchOne[1], matchTwo[1]];
    const oppUserOne = guild.members.cache.get(uIDOne);
    const oppUserTwo = guild.members.cache.get(uIDTwo);

    // user could not be found
    if (!oppUserOne || !oppUserTwo) {
      message.channel.send('One or more users could not be found');
      return null;
    }

    return this.container.gameLeaderboardService.createMatchupLeaderboardEmbed(
      oppUserOne.user,
      oppUserTwo.user,
      gameEnum
    );
  }

  private _getGameType(gameName: string): Maybe<GameType> {
    const gameAliases = this.container.gameLeaderboardService.gameAliases;
    if (gameAliases[GameType.TicTacToe].includes(gameName)) {
      return GameType.TicTacToe;
    }

    if (gameAliases[GameType.ConnectFour].includes(gameName)) {
      return GameType.ConnectFour;
    }

    return null;
  }
}
