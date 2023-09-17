import { CommandInteraction, Message } from 'discord.js';
import ms from 'ms';
import { ISlashCommand } from '../../common/slash';
import { ClassType, IContainer } from '../../common/types';
import { ClassTAModel } from '../../schemas/class.schema';
import { getConfirmCancelRow } from './addclasschans.plugin';

const CHAN_NAME: RegExp = /^[a-z]{3}[0-9]{4}[a-z]?.*$/;

const plugin = {
  commandName: 'delclasschans',
  name: 'Delete Class Channels',
  description: 'Deletes all class channels',
  defaultMemberPermissions: 'ADMINISTRATOR',
  async execute({ interaction, container }) {
    const msg = (await interaction.reply({
      content: `Are you sure you want to delete **${
        container.classService.getClasses(ClassType.ALL).size
      }** channels?\n\`!delclasschans <confirm | cancel>\``,
      components: [getConfirmCancelRow()],
      fetchReply: true,
    })) as Message;

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: ms('5m'),
    });

    collector.on('collect', async (btnInteraction) => {
      await btnInteraction.deferUpdate();
      if (btnInteraction.customId === 'confirm') {
        await deleteChannels(interaction, container);
      } else if (btnInteraction.customId === 'cancel') {
        await btnInteraction.followUp({ content: 'Canceled' });
      }

      collector.stop();
    });
  },
} satisfies ISlashCommand;

const deleteChannels = async (interaction: CommandInteraction, container: IContainer) => {
  const channels = container.guildService
    .get()
    .channels.cache.filter((chan) => chan.type === 'GUILD_TEXT' && !!chan.name.match(CHAN_NAME));
  const numChannels = channels.size;
  const deleteCaller = interaction.user.tag;

  await interaction.channel?.send(
    `Deleting **${numChannels}** channels at request of **${deleteCaller}**`
  );

  channels.forEach((channel) => {
    channel.delete();
  });

  await ClassTAModel.deleteMany({ guildID: container.guildService.get().id });
};

export default plugin;
