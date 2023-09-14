import { GuildMember } from 'discord.js';
import Constants from '../../common/constants';
import { ISlashCommand } from '../../common/slash';

const plugin = {
  commandName: 'users',
  name: 'Users Plugin',
  description: 'Displays the number of users in the server',
  execute({ interaction, container }) {
    const members = [...container.guildService.get().members.cache.values()];
    const totalMembers = container.guildService.get().memberCount;
    const onlineMembers = members.filter((member: GuildMember) => {
      return member.presence?.status !== 'offline';
    }).length;

    interaction.reply(
      `${Constants.ServerName} server currently has **${totalMembers} members** (${onlineMembers} currently online).`
    );
  },
} satisfies ISlashCommand;

export default plugin;
