import { EmbedBuilder } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup } from '../../common/types';

export default class PointsPlugin extends Plugin {
  public commandName: string = 'tacos';
  public name: string = 'Tacos Plugin';
  public description: string = 'Gets the number of Tacos you have';
  public usage: string = 'tacos';
  public override pluginAlias = [];
  public permission: ChannelGroup = ChannelGroup.Public;
  public override pluginChannelName: string = Constants.Channels.Public.Games;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const userDoc = await this.container.pointService.getUserPointDoc(message.author.id);
    const embed = new EmbedBuilder()
      .setTitle(`:taco: ${message.member?.displayName}'s Tacos :taco:`)
      .setDescription(`You have **${userDoc.numPoints}** Tacos`)
      .setFooter({ text: 'You can gamble with your Tacos with !gamble' });

    await message.reply({ embeds: [embed] });
  }
}
