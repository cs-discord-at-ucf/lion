import {
  ButtonInteraction,
  GuildChannel,
  MessageAttachment,
  MessageEmbed,
  TextChannel,
} from 'discord.js';
import Constants from '../../common/constants';
import { Command } from '../../common/slash';
import { ClassType, IContainer, Maybe } from '../../common/types';
import { createConfirmationReply } from '../../common/utils';

export default {
  commandName: 'broadcast',
  name: 'Broadcast',
  description: 'Sends an announcement to all class channels',
  defaultMemberPermissions: 'ADMINISTRATOR',
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
    const classes = getClassChannels(category, container);

    const onConfirm = async (btnInteraction: ButtonInteraction) => {
      await btnInteraction.followUp('Broadcasting...');
      await sendBroadcast(message, classes, attachment);
      await btnInteraction.followUp('Broadcast sent!');
    };

    await createConfirmationReply(interaction, {
      payload: {
        content: `You are about to send this announcement to \`${classes.length}\` classes... Are you sure?\n`,
        embeds: [createAnnouncementEmbed(message)],
        ...(attachment && { files: [attachment] }),
      },
      onConfirm,
    });
  },
} satisfies Command;

const sendBroadcast = (
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
