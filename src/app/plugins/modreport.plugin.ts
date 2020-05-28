import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { Report } from '../../services/report.service';

export class ModReportPlugin extends Plugin {
  public name: string = 'Mod Report Plugin';
  public description: string = 'add a report against a user';
  public usage: string = '!modreport <add/list> <username#numbers> [screenshots...]';
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    try {
      if (args[0] === 'add') {
        await this._handleAddReport(message, args);
      } else if (args[0] === 'list') {
        await this._handleListReport(message, args);
      } else {
        message.reply('Invalid command. See !help');
      }
    } catch (e) {
      message.reply('Something went wrong. Did you put the username correctly?');
      console.error(e);
    }
  }

  private async _handleAddReport(message: IMessage, args: string[]) {
    const rep: Report = new Report(
      message.guild,
      args[1],
      args.slice(2).join(' '),
      message.attachments.map((e) => e.url)
    );
    this.container.reportService.addReport(rep);

    message.reply(`Added report on ${args[1]}: ${rep.toString()}`);
  }

  private async _handleListReport(message: IMessage, args: string[]) {
    const msg = await this.container.reportService.generateReport(message.guild, args[1]);
    message.reply(
      msg.length === 0
        ? `No reports on ${args[1]}`
        : `***Here are the reports on ${args[1]}***\n${msg}`
    );
  }
}
