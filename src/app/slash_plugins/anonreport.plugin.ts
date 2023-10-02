import { Command } from '../../common/slash';

const plugin = {
  commandName: 'anonreport',
  name: 'anonreport',
  description: 'anonymously report a concern to moderation team',
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
  async execute({ interaction, container }) {
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
  },
} satisfies Command;

export default plugin;
