import { EmbedAuthorData, MessageEmbed } from 'discord.js';
import { ISlashCommand } from '../../common/slash';
import { IContainer } from '../../common/types';
import { PointsDocument } from '../../schemas/points.schema';

async function give(
  container: IContainer,
  giver: PointsDocument,
  recipient: PointsDocument,
  amount: number
) {
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
}

export default {
  name: 'give',
  commandName: 'give',
  description: 'Give your tacos to someone else',
  options: [
    {
      name: 'recipient',
      description: 'The user to give tacos to',
      type: 'USER',
      required: true,
    },
    {
      name: 'amount',
      description: 'The amount of tacos to give, use "all" to give all your tacos',
      type: 'STRING',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const recipient = interaction.options.getUser('recipient', true);
    const amount = interaction.options.getString('amount', true);

    if (interaction.user.id === recipient.id) {
      await interaction.reply({ content: 'You cannot give tacos to yourself!', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const [userDoc, recipientDoc] = await Promise.all(
      [interaction.user.id, recipient.id].map((id) => container.pointService.getUserPointDoc(id))
    );

    // Try to parse the number given by user
    const pointsToGive = amount.toLowerCase() === 'all' ? userDoc.numPoints : parseInt(amount);

    if (pointsToGive > userDoc.numPoints || pointsToGive <= 0) {
      await interaction.followUp(`You only have ${userDoc.numPoints} tacos`);
      return;
    }

    await interaction.followUp({
      embeds: [await give(container, userDoc, recipientDoc, pointsToGive)],
    });
  },
} satisfies ISlashCommand;
