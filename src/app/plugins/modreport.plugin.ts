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

  private _commadRegex: RegExp = /(add|list)\s+([^#]+#\d{4})\s*(.*)/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const full_arg = args.join(' ');
    const match_arr = full_arg.match(this._commadRegex);

    if (!match_arr) {
      message.reply('Invalid syntax.');
      return;
    }

    args[0] = match_arr[1];
    args[1] = match_arr[2];
    args[2] = match_arr[3];

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
      args[2],
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
