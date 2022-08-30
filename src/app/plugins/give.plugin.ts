import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { PointsDocument } from '../../schemas/points.schema';

export default class GivePlugin extends Plugin {
  public commandName: string = 'give';
  public name: string = 'Give Plugin';
  public description: string = 'Give your tacos to someone else';
  public usage: string = 'give @Tanndlin all\n give @Tanndlin 100';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public override pluginChannelName: string = Constants.Channels.Public.Games;

  public override commandPattern: RegExp = /(all|\d+)/;

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]): boolean {
    if (args.length !== 2) {
      return false;
    }

    return message.mentions.users.size === 1 && this.commandPattern.test(args[1]);
  }

  public async execute(message: IMessage, args: string[]) {
    const recipientUser = message.mentions.users.first()!; // Asserting true after validate
    const [userDoc, recipient] = await Promise.all(
      [message.author.id, recipientUser.id].map((id) =>
        this.container.pointService.getUserPointDoc(id)
      )
    );

    // Try to gamble the number given by user
    const pointsToGive = args[0].toLowerCase() === 'all' ? userDoc.numPoints : parseInt(args[0]);

    if (pointsToGive > userDoc.numPoints || pointsToGive <= 0) {
      message.reply(`You only have ${userDoc.numPoints} tacos`);
      return;
    }

    message.reply({
      embeds: [await this._give(userDoc, recipient, pointsToGive)],
    });
  }

  private async _give(
    giver: PointsDocument,
    recipient: PointsDocument,
    amount: number
  ): Promise<MessageEmbed> {
    await Promise.all([
      this.container.pointService.awardPoints(giver.userID, -amount),
      this.container.pointService.awardPoints(recipient.userID, amount),
    ]);

    const [giverUser, recipientUser] = await Promise.all(
      [giver.userID, recipient.userID].map((id) => this.container.clientService.users.fetch(id))
    );

    return new MessageEmbed()
      .setTitle(`${giverUser} gave ${recipientUser} ${amount} tacos`)
      .addField(`${giverUser}'s tacos`, giver.numPoints + '', true)
      .addField(`${recipientUser}'s tacos`, recipient.numPoints + '', true)
      .setTimestamp(Date.now());
  }
}
