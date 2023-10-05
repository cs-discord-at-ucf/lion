import { EmbedAuthorData, MessageEmbed } from 'discord.js';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';
import { PointsDocument } from '../../schemas/points.schema';

const command = {
  commandName: 'give',
  name: 'Give Plugin',
  description: 'Give your tacos to someone else',
  options: [
    {
      name: 'recipient',
      description: 'The person you want to give tacos to',
      type: 'USER',
      required: true,
    },
    {
      name: 'amount',
      description: 'The amount of tacos you want to give',
      type: 'STRING',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const recipientUser = interaction.options.getUser('recipient', true);
    const [userDoc, recipient] = await Promise.all(
      [interaction.user.id, recipientUser.id].map((id) =>
        container.pointService.getUserPointDoc(id)
      )
    );

    const isGivingSelf = interaction.user.id === recipientUser.id;
    if (isGivingSelf) {
      interaction.reply('You cannot give tacos to yourself!');
      return;
    }

    // Try to parse the number given by user
    const amtArg = interaction.options.getString('amount', true);
    const pointsToGive = amtArg.toLowerCase() === 'all' ? userDoc.numPoints : parseInt(amtArg);

    if (pointsToGive > userDoc.numPoints || pointsToGive <= 0) {
      interaction.reply(`You only have ${userDoc.numPoints} tacos`);
      return;
    }

    await interaction.deferReply();

    interaction.followUp({
      embeds: [await give(userDoc, recipient, pointsToGive, container)],
    });
  },
} satisfies Command;

const give = async (
  giver: PointsDocument,
  recipient: PointsDocument,
  amount: number,
  container: IContainer
): Promise<MessageEmbed> => {
  await Promise.all([
    container.pointService.awardPoints(giver.userID, -amount),
    container.pointService.awardPoints(recipient.userID, amount),
  ]);

  const [giverMember, recipientMember] = await Promise.all(
    [giver.userID, recipient.userID].map((id) => container.guildService.get().members.fetch(id))
  );

  return new MessageEmbed()
    .setTitle(`${giverMember.displayName} gave ${recipientMember.displayName} ${amount} tacos`)
    .addField(
      'New tacos',
      `${giverMember}: ${giver.numPoints - amount}\n${recipientMember}: ${
        recipient.numPoints + amount
      }`
    )
    .setAuthor({
      name: giverMember.displayName,
      iconURL: giverMember.user.avatarURL(),
    } as EmbedAuthorData)
    .setColor('#ffca06')
    .setTimestamp(Date.now());
};

export default command;
