import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { PointsDocument, PointsModel } from '../../schemas/points.schema';

export default class PointsPlugin extends Plugin {
  public commandName: string = 'points';
  public name: string = 'Points Plugin';
  public description: string = 'Gets the number of points you have';
  public usage: string = 'points';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const userDoc: Maybe<PointsDocument> = await PointsModel.findOne({
      userID: message.author.id,
      guildID: this.container.guildService.get().id,
    });

    if (!userDoc) {
      PointsModel.create({
        userID: message.author.id,
        guildID: this.container.guildService.get().id,
        numPoints: 0,
      });

      await this._sendResponseEmbed(message, 0);
      return;
    }

    await this._sendResponseEmbed(message, userDoc.numPoints);
  }

  private _sendResponseEmbed(message: IMessage, points: number) {
    const embed = new MessageEmbed();

    embed.setTitle(`${message.member?.displayName}'s points`);
    embed.setDescription(`You have **${points}** points`);
    embed.setFooter('You can gamble with your points with !gamble');

    return message.reply({ embeds: [embed] });
  }
}
