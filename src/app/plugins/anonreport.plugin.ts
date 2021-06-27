import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class DmReportPlugin extends Plugin {
  public commandName: string = 'anonreport';
  public name: string = 'anonreport';
  public description: string = 'anonymously report a concern to moderation team';
  public usage: string = 'simply DM lion, start message with !anonreport and write your concern';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;

  public usableInDM = true;
  public usableInGuild = true;

  constructor(public container: IContainer) {
    super();
  }

  public validate(_message: IMessage, args: string[]) {
    return !!args.length;
  }

  public async execute(message: IMessage, args: string[]) {
    const maybe_ticket_id = args[0];
    const isTicketId = this.container.modService.isTicketId(maybe_ticket_id);

    // treat as new report if no ticket_id provided and no guild (dm)
    if (!isTicketId && !message.guild) {
      await this.container.modService
        .fileAnonReport(message)
        .then((ticket_id) =>
          message.reply(
            'Thank you, your report has been recorded.\n' +
              `Staff may update you through Ticket \`${ticket_id}\`.\n` +
              `Also, you can add to this report with \`!${this.name} ${ticket_id} ...\` in this DM.`
          )
        )
        .catch((e) => this.container.loggerService.error(e));
      return;
    }

    if (!isTicketId) {
      await message.reply(
        `Please provide a ticket id to respond within a guild. Ex. \`!${
          this.name
        } ${this.container.modService.generateTicketId(message)} ...\``
      );
      return;
    }

    // if we get here we have a valid ticket id

    const handleTicket = async () => {
      return await (message.guild
        ? this.container.modService.respondToAnonReport(maybe_ticket_id, message)
        : this.container.modService.fileAnonReportWithTicketId(maybe_ticket_id, message));
    };

    await handleTicket().then((ticket_id) =>
      message.reply(`Thank you. The update for Ticket ${ticket_id} was processed.`)
    );
  }
}
