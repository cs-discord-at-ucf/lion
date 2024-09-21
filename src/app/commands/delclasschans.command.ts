import { ButtonInteraction } from 'discord.js';
import Constants from '../../common/constants';
import { ISlashCommand } from '../../common/slash';
import { ClassType, IContainer } from '../../common/types';
import { createConfirmationReply } from '../../common/utils';
import { ClassTAModel } from '../../schemas/class.schema';

const command = {
  commandName: 'delclasschans',
  name: 'Delete Class Channels',
  description: 'Deletes all class channels',
  defaultMemberPermissions: 'ADMINISTRATOR',
  async execute({ interaction, container }) {
    await createConfirmationReply(interaction, {
      payload: {
        content: `Are you sure you want to delete **${
          container.classService.getClasses(ClassType.ALL).size
        }** channels?`,
      },
      onConfirm: (btnInteraction: ButtonInteraction) => deleteChannels(btnInteraction, container),
    });
  },
} satisfies ISlashCommand;

const deleteChannels = async (interaction: ButtonInteraction, container: IContainer) => {
  const channels = container.guildService
    .get()
    .channels.cache.filter((chan) => chan.type === 'GUILD_TEXT' && !!chan.name.match(Constants.Patterns.ClassChannelName));
  const numChannels = channels.size;
  const deleteCaller = interaction.user.tag;

  await interaction.followUp(
    `Deleting **${numChannels}** channels at request of **${deleteCaller}**`
  );

  await Promise.all(channels.map((channel) => channel.delete()));
  await ClassTAModel.deleteMany({ guildID: container.guildService.get().id });

  await interaction.followUp('Channels deleted!');
};

export default command;
