import { MessageEmbed, User } from "discord.js";
import { IMessage } from "../../common/types";

type Scores = { [key: string]: number };
type ScoreDirection = 'Increasing' | 'Decreasing';

export default abstract class Game {
  private game: string;
  private players: Array<User>;
  private scores: Scores;
  private scoreDirection: ScoreDirection;

  constructor(game: string, message: IMessage, initialScore: number = 0, scoreDirection: ScoreDirection = 'Decreasing') {
    this.game = game;
    
    try {
      this.players = this._initializePlayers(message);
    } catch (e) {
      console.error(e);
      this.players = [];
    }

    this.scores = this._initializeScores(initialScore);
    this.scoreDirection = scoreDirection;
  }

  private _initializePlayers(message: IMessage): Array<User> {
    const mentions = message.mentions.members;
    if (!mentions) {
      throw 'FATAL: Games without players are not supported';
    }

    return mentions.map((guildMember, _) => guildMember.user);
  }

  private _initializeScores(initialScore: number = 0): Scores  {
    const scores: Scores = {};
    this.players.forEach(player => scores[player.username] = initialScore);
    return scores;
  }

  /**
   * Increment a player's score by the given value.
   * 
   * @param  {User} palyer user profile of the player to increment
   * @param  {number} increment (default: 1) value to increment by
   * @returns Scores
   */
  public incrementPlayerScore(player: User, increment: number = 1): Scores {
    this.scores[player.username] += increment;
    return this.scores;
  }

  /**
   * Set a player's score to the given value.
   * 
   * @param  {User} player user profile of the player to increment
   * @param  {number} value value to set score to
   * @returns Scores
   */
  public setPlayerScore(playerName: string, value: number): Scores {
    this.scores[playerName] = value;
    return this.scores;
  }
  /**
   * Generates and returns an embed for game instance.
   * 
   * @param  {string} content main content of the game.
   * @returns MessageEmbed
   */
  public renderGame(content: string): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(this.game);
    embed.setDescription(content);
    return embed;
  }

  /**
   * 
   * GETTERS
   * 
   */

  public getPlayers(): Array<User> {
    return this.players;
  }

  public getScores(): Scores {
    return this.scores;
  }

  public getWinner(): string | undefined {
    const standings = this.getStandings();
    return standings.length > 0 ? standings[0] : undefined;
  }

  public getStandings(): Array<string> {
    return Object.entries(this.scores)
      .sort(([,a], [,b]) => this.scoreDirection === 'Increasing' ? a - b : b - a)
      .reduce((standings: Array<string>, [user]) => ([...standings, user]), []);
  }
}