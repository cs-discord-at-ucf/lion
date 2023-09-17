import { GuildChannel } from 'discord.js';
import { Command } from '../../common/slash';

const plugin = {
  commandName: 'chanban',
  name: 'ChanBan Plugin',
  description: "Restricts a user's access to specified channels",
  options: [
    {
      name: 'user',
      description: 'The user to ban from channels',
      type: 'USER',
      required: true,
    },
    {
      name: 'channel',
      description: 'The channel to ban the user from',
      type: 'CHANNEL',
      required: true,
      channelTypes: ['GUILD_TEXT'],
    },
  ],
  async execute({ interaction, container }) {
    const user = interaction.options.getUser('user', true);
    const channel = interaction.options.getChannel('channel', true) as GuildChannel;

    try {
      const success =
        (await container.modService.channelBan(container.guildService.get(), user, [channel]))
          .length > 0;

      await interaction.reply(
        success ? `Banned user from ${channel}` : 'Could not ban user from channel'
      );
    } catch (ex) {
      container.loggerService.error(`When trying to ban ${user.username} from channels.`, ex);
    }
  },
} satisfies Command;

export default plugin;
