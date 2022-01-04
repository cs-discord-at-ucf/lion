import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IUserPoints } from '../../common/types';

export default class PointLeaderBoardPlugin extends Plugin {
  public commandName: string = 'pointleaderboard';
  public name: string = 'Point Leaderboard Plugin';
  public description: string = 'Gets the people with the most points';
  public usage: string = 'pointleaderboard\npointlb';
  public override pluginAlias = ['pointlb'];
  public permission: ChannelType = ChannelType.All;

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

    const embed = new MessageEmbed();

    embed.setTitle('Top Points');
    embed.addField(
      'You',
      `${userRank}. ${await convertIUserPointToString(userDoc as IUserPoints)}`
    );

    embed.addField(
      'Leaderboard',
      (
        await Promise.all(
          topPoints.map(
            async (userPoints: IUserPoints, i: number) =>
              `${i + 1}. ${await convertIUserPointToString(userPoints)}`
          )
        )
      ).join('\n')
    );

    embed.setTimestamp(new Date());

    message.reply({ embeds: [embed] });
  }
}
