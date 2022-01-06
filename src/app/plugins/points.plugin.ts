import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

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
    const userDoc = await this.container.pointService.getUserPointDoc(message.author.id);
    const embed = new MessageEmbed()
      .setTitle(`${message.member?.displayName}'s points`)
      .setDescription(`You have **${userDoc.numPoints}** points`)
      .setFooter('You can gamble with your points with !gamble');

    await message.reply({ embeds: [embed] });
  }
}
