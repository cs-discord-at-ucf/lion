import {
  CommandInteraction,
  GuildMember,
  MessageEmbed,
  Snowflake,
  TextChannel,
  User,
} from 'discord.js';
import mongoose, { Document } from 'mongoose';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';
import { ClassTAModel } from '../../schemas/class.schema';

export interface ITAEntry {
  userID: Snowflake;
  chanID: Snowflake;
  guildID: Snowflake;
}

export type TADocument = ITAEntry & Document;

export default {
  name: 'TA Plugin',
  commandName: 'ta',
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
    {
      type: 'SUB_COMMAND',
      name: 'ask',
      description: 'Ask a question to the TAs',
      options: [
        {
          type: 'STRING',
          name: 'question',
          description: 'The question to ask',
          required: true,
        },
      ],
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

    if (subCommand === 'ask') {
      await handleAsk(interaction, container);
      return;
    }

    // --------TA only commands--------

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

const handleAsk = async (interaction: CommandInteraction, container: IContainer) => {
  const question = interaction.options.getString('question', true);

  const channel = interaction.channel!.isThread()
    ? interaction.channel.parent
    : interaction.channel;
  const TAs: GuildMember[] = await getTAs(interaction, container, channel as TextChannel);
  if (!TAs.length) {
    await interaction.reply('There are no TAs registered for this class');
    return;
  }

  const mentions = TAs.map((m) => m.user.toString()).join(' ');
  const embed: MessageEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
    .setDescription(`${question}`)
    .setTimestamp();

  await interaction.reply({ content: mentions, embeds: [embed] });
};

const getTAs = async (
  interaction: CommandInteraction,
  container: IContainer,
  chan: TextChannel
): Promise<GuildMember[]> => {
  if (!mongoose.connection.readyState) {
    await interaction.reply({ content: 'Error connecting to the DB', ephemeral: true });
    return [];
  }

  const fromCollection = (
    await ClassTAModel.find({
      guildID: chan.guild.id,
    })
  ).filter((e) => e.chanID === chan.id);

  // Make sure the members are cached before lookup
  await container.guildService.get().members.fetch();
  return fromCollection.reduce((acc: GuildMember[], entry: ITAEntry) => {
    const member = container.guildService.get().members.cache.get(entry.userID);
    if (member) {
      acc.push(member);
    }

    return acc;
  }, []);
};

const getCollection = (): mongoose.Model<TADocument> => {
  if (!mongoose.connection.readyState) {
    throw new Error('Error getting data from DB');
  }

  return ClassTAModel;
};
