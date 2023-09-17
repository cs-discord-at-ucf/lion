import { GuildMember, Role, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { ISlashCommand } from '../../common/slash';
import { getRandom } from '../../common/utils';

export const BLACKLISTED_ROLES: string[] = ['suspended'];

const plugin = {
  commandName: 'addroles',
  name: 'Add Roles',
  description: 'Adds roles to user.',
  options: [
    {
      name: 'role',
      description: 'The role to add',
      type: 'ROLE',
      required: true,
    },
  ],

  async execute({ interaction, container }) {
    const member = interaction.member as GuildMember;
    if (!member) {
      await interaction.reply('Could not resolve you to a member');
      return;
    }

    const userRoleNames = member.roles.cache.map((role) => role.name.toLowerCase());
    if (userRoleNames.some((roleName) => roleName === 'suspended')) {
      await interaction.reply('You cannot add roles while suspended');
      return;
    }

    const role = interaction.options.getRole('role', true);
    if (!role) {
      await interaction.reply('Could not resolve role');
      return;
    }

    if (BLACKLISTED_ROLES.includes(role.name.toLowerCase())) {
      await interaction.reply('You cannot add that role');
      return;
    }

    await interaction.deferReply();
    await member.roles
      .add(role as Role)
      .then(() => {
        const alumniChannel = container.guildService.getChannel(
          Constants.Channels.Public.AlumniLounge
        ) as TextChannel;
        const gradStudChannel = container.guildService.getChannel(
          Constants.Channels.Public.GradCafe
        ) as TextChannel;

        // check for alumni or grad student role, and send a random welcome
        const roleName = role.name.toLowerCase();
        if (roleName === Constants.Roles.Alumni.toLowerCase()) {
          alumniChannel.send(getRandomWelcome(member, roleName));
        }

        if (roleName === Constants.Roles.GradStudent.toLowerCase()) {
          gradStudChannel.send(getRandomWelcome(member, roleName));
        }

        interaction.followUp(`Successfully added: ${role.name}`);
      })
      .catch(() => {
        interaction.followUp(`Failed to add role: ${role.name}`);
      });
  },
} satisfies ISlashCommand;

const getRandomWelcome = (user: GuildMember, role: string): string => {
  if (role === Constants.Roles.Alumni.toLowerCase()) {
    return getRandom(alumniWelcomes(user.toString()));
  }

  return getRandom(gradStudWelcomes(user.toString()));
};

const alumniWelcomes = (user: string) => {
  return [
    `Congratulations ${user} on all your hard work!`,
    `You made it, ${user}! Congratulations!`,
    `Congratulations and BRAVO, ${user}`,
    `This calls for celebrating! Congratulations ${user}!`,
    `You did it! Congrats ${user}!`,
    `Caps off to you, Graduate! Well done, ${user}!`,
  ];
};

const gradStudWelcomes = (user: string) => {
  return [
    `Good luck enduring a few more years of hell ${user}!`,
    `Hope grad school doesn't take a toll on ya ${user}`,
    `Welcome ${user}, you are now a Grad Knight!`,
  ];
};

export default plugin;
