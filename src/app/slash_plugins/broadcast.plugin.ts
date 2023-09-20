import {
  CommandInteraction,
  GuildChannel,
  Message,
  MessageAttachment,
  MessageEmbed,
  TextChannel,
} from 'discord.js';
import ms from 'ms';
import Constants from '../../common/constants';
import { Command } from '../../common/slash';
import { ClassType, IContainer, Maybe } from '../../common/types';
import { getConfirmCancelRow } from '../../common/utils';

export default {
  commandName: 'broadcast',
  name: 'Broadcast',
  description: 'Sends an announcement to all class channels',
  options: [
    {
      type: 'STRING',
      name: 'message',
      description: 'The message to send',
      required: true,
    },
    {
      type: 'STRING',
      name: 'category',
      description: 'The class category to send to',
      required: true,
      choices: Object.values(ClassType).map((c) => ({ name: c, value: c })),
    },
    {
      type: 'ATTACHMENT',
      name: 'attachment',
      description: 'The attachment to send',
      required: false,
    },
  ],
  async execute({ interaction, container }) {
    const message = interaction.options.getString('message')!;
    const category = interaction.options.getString('category')!;
    const attachment = interaction.options.getAttachment('attachment');

    const classesToSend = getClassChannels(category, container);
    await reportToUser(interaction, message, classesToSend, attachment);
  },
} satisfies Command;

const handleConfirm = (
  message: string,
  classes: GuildChannel[],
  attachment: Maybe<MessageAttachment>
) => {
  const embed = createAnnouncementEmbed(message);

  return Promise.all(
    classes.map((chan) =>
      (chan as TextChannel).send({
        embeds: [embed],
        ...(attachment && { files: [attachment] }),
      })
    )
  );
};

const getClassChannels = (catName: string, container: IContainer): GuildChannel[] => {
  const classType: Maybe<ClassType> = Object.values(ClassType).find(
    (c) => c.toLowerCase() === catName.toLowerCase()
  );

  if (!classType) {
    return [];
  }

  return getClassesFromClassMap(container.classService.getClasses(classType));
};

const reportToUser = async (
  interaction: CommandInteraction,
  message: string,
  classes: GuildChannel[],
  attachment: Maybe<MessageAttachment>
) => {
  const msg = (await interaction.reply({
    ...{
      content: `You are about to send this announcement to \`${classes.length}\` classes... Are you sure?\n`,
      embeds: [createAnnouncementEmbed(message)],
      components: [getConfirmCancelRow()],
      fetchReply: true,
    },
    ...(attachment && { files: [attachment] }),
  })) as Message;

  const collector = msg.createMessageComponentCollector({
    componentType: 'BUTTON',
    time: ms('5m'),
  });

  collector.on('collect', async (btnInteraction) => {
    if (btnInteraction.customId === 'confirm') {
      try {
        await btnInteraction.reply('Broadcasting...');
        await handleConfirm(message, classes, attachment);
        await btnInteraction.editReply('Broadcast sent!');
      } catch (err) {
        console.log(err);
      }
    } else {
      await btnInteraction.reply({
        content: 'Broadcast cancelled.',
      });

      collector.stop();
    }
  });
};

const createAnnouncementEmbed = (message: string) => {
  return new MessageEmbed()
    .setTitle('Announcement!')
    .setColor('#ffca06')
    .setThumbnail(Constants.LionPFP)
    .setDescription(message);
};

const getClassesFromClassMap = (map: Map<string, GuildChannel>) => {
  const classChans = [];
  for (const classObj of map) {
    const [, chan] = classObj;
    classChans.push(chan);
  }

  return classChans;
};
