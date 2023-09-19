import { GuildMember } from 'discord.js';
import Constants from '../../common/constants';
import { Command } from '../../common/slash';

const plugin = {
  commandName: 'anonreport',
  name: 'anonreport',
  description: 'anonymously report a concern to moderation team',
  options: [
    {
      type: 'SUB_COMMAND',
      name: 'report',
      description: 'file a new report',
      options: [
        {
          type: 'STRING',
          name: 'message',
          description: 'the message to report',
          required: true,
        },
        {
          type: 'ATTACHMENT',
          name: 'screenshot',
          description: 'a screenshot of the message',
          required: false,
        },
      ],
    },
    {
      type: 'SUB_COMMAND',
      name: 'respond',
      description: 'respond to an existing report',
      options: [
        {
          type: 'STRING',
          name: 'ticket_id',
          description: 'the ticket id to respond to',
          required: true,
        },
        {
          type: 'STRING',
          name: 'message',
          description: 'the message to respond with',
          required: true,
        },
      ],
    },
  ],
  async execute({ interaction, container }) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'report') {
      await container.modService
        .fileAnonReport(interaction)
        .then((ticket_id) =>
          interaction.reply({
            content:
              'Thank you, your report has been recorded.\n' +
              `Staff may update you through Ticket \`${ticket_id}\`.\n`,
            ephemeral: true,
          })
        )
        .catch((e) => container.loggerService.error(`anonreport::Execute ${e}`));
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member) {
      return interaction.reply('You must be in a server to use this command.');
    }

    const isModerator = container.userService.hasRole(member, Constants.Roles.Moderator);

    if (subcommand === 'respond') {
      if (!isModerator) {
        return interaction.reply({
          content: 'You must be a moderator to use this command.',
          ephemeral: true,
        });
      }

      const ticket_id = interaction.options.getString('ticket_id');
      if (!ticket_id) {
        return interaction.reply('Please provide a ticket id.');
      }

      const handleTicket = async () => {
        return await container.modService.respondToAnonReport(ticket_id, interaction);
      };

      await handleTicket().then((ticket_id) =>
        interaction.reply(`Thank you. The update for Ticket ${ticket_id} was processed.`)
      );
    }
  },
} satisfies Command;

export default plugin;
