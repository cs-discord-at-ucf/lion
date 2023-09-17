import { GuildMember, Role } from 'discord.js';
import { ISlashCommand } from '../../common/slash';
import { BLACKLISTED_ROLES } from './addroles.plugin';

const plugin = {
  commandName: 'delroles',
  name: 'Roles Plugin',
  description: 'Removes roles from user.',
  options: [
    {
      name: 'role',
      description: 'The role to remove',
      type: 'ROLE',
      required: true,
    },
  ],

  async execute({ interaction }) {
    const member = interaction.member as GuildMember;
    if (!member) {
      await interaction.reply('Could not resolve you to a member');
      return;
    }

    const role = interaction.options.getRole('role', true) as Role;
    if (!role) {
      await interaction.reply('Could not resolve role');
      return;
    }

    if (BLACKLISTED_ROLES.includes(role.name.toLowerCase())) {
      await interaction.reply('You cannot remove that role');
      return;
    }

    await interaction.deferReply();
    await member.roles
      .remove(role)
      .then(() => {
        interaction.followUp(`Successfully removed: ${role.name}`);
      })
      .catch(() => {
        interaction.followUp(`Failed to remove role: ${role.name}`);
      });
  },
} satisfies ISlashCommand;

export default plugin;
