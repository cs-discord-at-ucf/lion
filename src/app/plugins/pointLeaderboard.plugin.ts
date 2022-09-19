import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IUserPoints } from '../../common/types';

export default class PointLeaderBoardPlugin extends Plugin {
  public commandName: string = 'tacoleaderboard';
  public name: string = 'Taco Leaderboard Plugin';
  public description: string = 'Gets the people with the most Tacos';
  public usage: string = 'tacoleaderboard\ntacolb';
  public override pluginAlias = ['tacolb'];
  public permission: ChannelType = ChannelType.Public;
  public override pluginChannelName: string = Constants.Channels.Public.Games;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const userDoc = await this.container.pointService.getUserPointDoc(message.author.id);
    const userRank = await this.container.pointService.getUserRank(message.author.id);
    const topPoints = await this.container.pointService.getTopPoints(15);

    const convertIUserPointToString = async (userPoints: IUserPoints) => {
      const user = await this.container.clientService.users.fetch(userPoints.userID);
      return `${user ?? userPoints.userID}: ${userPoints.numPoints}`;
    };

    const embed = new MessageEmbed()
      .setTitle(':taco: Top Tacos :taco:')
      .addField('You', `${userRank}. ${await convertIUserPointToString(userDoc as IUserPoints)}`)
      .addField(
        'Leaderboard',
        (
          await Promise.all(
            topPoints.map(
              async (userPoints: IUserPoints, i: number) =>
                `${i + 1}. ${await convertIUserPointToString(userPoints)}`
            )
          )
        ).join('\n')
      )
      .addField(
        'Last Place',
        `${await convertIUserPointToString(await this.container.pointService.getLastPlace())}`
      )
      .setTimestamp(Date.now());

    message.reply({ embeds: [embed] });
  }
}
