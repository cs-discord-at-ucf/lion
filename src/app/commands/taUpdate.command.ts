import { CommandInteraction, GuildMember, TextChannel, User } from 'discord.js';
import mongoose from 'mongoose';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';
import { ClassTAModel, TADocument } from '../../schemas/class.schema';

export default {
  name: 'TA Update Plugin',
  commandName: 'taupdate',
  description: 'Allows TAs to register for classes.',
  defaultMemberPermissions: 'ADMINISTRATOR',
  options: [
    {
      type: 'SUB_COMMAND',
      name: 'register',
      description: 'Register as a TA for this class',
    },
    {
      type: 'SUB_COMMAND',
      name: 'remove',
      description: 'Remove yourself as a TA for this class',
    },
  ],
  async execute({ interaction, container }) {
    const subCommand = interaction.options.getSubcommand(true);

    const channel = interaction.channel!.isThread()
      ? (interaction.channel.parent as TextChannel)
      : (interaction.channel as TextChannel);

    const isClassChan = container.classService.isClassChannel(channel.name);
    if (!isClassChan) {
      await interaction.reply({
        content: 'Please use this command in a class channel',
        ephemeral: true,
      });
      return;
    }

    if (interaction.channel!.isThread()) {
      await interaction.reply({
        content: 'You cannot register/unregister as a TA in a thread.',
        ephemeral: true,
      });
      return;
    }

    if (subCommand === 'register') {
      await interaction.reply(await handleRegister(container, interaction));
      return;
    }

    await interaction.reply(await handleRemove(container, interaction));
  },
} satisfies Command;

const handleRegister = async (
  container: IContainer,
  interaction: CommandInteraction
): Promise<string> => {
  try {
    const guild = interaction.guild!;

    const TACollection = getCollection();
    const isRegistered = Boolean(
      await TACollection.findOne({
        userID: interaction.user.id,
        guildID: guild.id,
        chanID: interaction.channel!.id,
      })
    );
    if (isRegistered) {
      return 'You are already registered as a TA for this class';
    }

    await TACollection.create({
      userID: interaction.user.id,
      guildID: guild.id,
      chanID: interaction.channel!.id,
    });

    await setTopic(container, interaction, TACollection);
  } catch (e) {
    return 'Error registering as a TA';
  }

  // After register in the DB, give perms for deyeeting messages
  await setManageMessagesForChannel(
    container,
    interaction.channel as TextChannel,
    interaction.user,
    true
  );
  return 'Successfully registered as a TA';
};

const handleRemove = async (
  container: IContainer,
  interaction: CommandInteraction
): Promise<string> => {
  try {
    const guild = interaction.guild!;

    const TACollection = getCollection();
    await TACollection.deleteOne({
      guildID: guild.id,
      userID: interaction.user.id,
      chanID: interaction.channel!.id,
    });

    await setTopic(container, interaction, TACollection);
  } catch (e) {
    return 'Error removing as a TA';
  }

  // After remove from the DB, remove perms for deyeeting messages
  await setManageMessagesForChannel(
    container,
    interaction.channel as TextChannel,
    interaction.user,
    false
  );
  return 'Successfully removed as a TA';
};

const setManageMessagesForChannel = (
  container: IContainer,
  chan: TextChannel,
  user: User,
  canManage: boolean
) => {
  return chan.permissionOverwrites
    .edit(user, {
      MANAGE_MESSAGES: canManage,
    })
    .catch((e) =>
      container.loggerService.warn(`Error giving TA permission to manage messages: ${e}`)
    );
};

const setTopic = async (
  container: IContainer,
  interaction: CommandInteraction,
  TACollection: mongoose.Model<TADocument>
) => {
  const TAs = await TACollection.find({
    guildID: interaction.guild?.id,
    chanID: interaction.channel?.id,
  });

  const members = TAs.map((t) => container.guildService.get().members.cache.get(t.userID)).filter(
    Boolean
  );

  const chan = interaction.channel as TextChannel;
  const usernames = members.map((m) => (m as GuildMember).user.username);
  const [className] = (chan.topic ?? '').split(' | TAs:');
  chan.setTopic(`${className} | TAs: ${usernames.join(', ')}`);
};

const getCollection = (): mongoose.Model<TADocument> => {
  if (!mongoose.connection.readyState) {
    throw new Error('Error getting data from DB');
  }

  return ClassTAModel;
};
