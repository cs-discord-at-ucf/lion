import { Command } from '../../common/slash';

const plugin = {
  commandName: 'anonrespond',
  name: 'anonrespond',
  description: 'anonymously report a concern to moderation team',
  defaultMemberPermissions: 'MODERATE_MEMBERS',
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
  async execute({ interaction, container }) {
    const ticket_id = interaction.options.getString('ticket_id', true);
    if (!ticket_id) {
      return interaction.reply('Please provide a ticket id.');
    }

    const handleTicket = async () => {
      return await container.modService.respondToAnonReport(ticket_id, interaction);
    };

    await handleTicket().then((ticket_id) =>
      interaction.reply(`Thank you. The update for Ticket ${ticket_id} was processed.`)
    );
  },
} satisfies Command;

export default plugin;
