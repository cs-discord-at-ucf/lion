import { GuildMember, Role } from 'discord.js';
import Constants from '../../common/constants';
import { Command } from '../../common/slash';

const BLACKLIST = [
  Constants.Roles.Everyone,
  Constants.Roles.Unverifed,
  Constants.Roles.NitroBooster,
  Constants.Roles.Suspended,
].map((r) => r.toLowerCase());

const command = {
  commandName: 'listroles',
  name: 'List Roles',
  description: 'Lists all available roles.',
  async execute({ interaction, container }) {
    let res = '```\n';

    const member = interaction.member as GuildMember;
    if (!member) {
      await interaction.reply({ content: 'Could not resolve you to a member', ephemeral: true });
      return;
    }

    const mp = new Map();
    for (const role of member.roles.cache) {
      mp.set(role[1].name.toLowerCase(), true);
    }

    const chatbotRole = container.guildService.getRole('Chatbot');
    container.guildService
      .get()
      .roles.cache.sort((a: Role, b: Role) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      )
      .filter((role) => !BLACKLIST.includes(role.name.toLowerCase())) // Not in blacklist
      .filter((role) => role.position < chatbotRole.position) // Make sure the user can add it
      .map((role) => {
        if (mp.get(role.name.toLowerCase())) {
          res += '-- ';
        } else {
          res += '   ';
        }
        res += `${role.name.toLowerCase()}\n`;
      });
    res += '```';
    await interaction.reply({ content: res, ephemeral: true });
  },
} satisfies Command;

export default command;
