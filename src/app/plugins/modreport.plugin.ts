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

  private _commandPattern: RegExp = /(add|list|warn|ban)\s+([^#]+#\d{4})\s*(.*)/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const match_arr = args.join(' ').match(this._commandPattern);

    if (!match_arr) {
      message.reply('Invalid syntax.');
      return;
    }

    const sub_command = match_arr[1];
    const user_handle = match_arr[2];
    const description = match_arr[3];

    try {
      if (sub_command === 'add') {
        await this._handleAddReport(message, user_handle, description);
      } else if (sub_command === 'list') {
        await this._handleListReport(message, user_handle);
      } else if (sub_command === 'warn') {
        await this._handleIssueWarning(message, user_handle, description);
      } else if (sub_command === 'ban') {
        await this._handleIssueBan(message, user_handle, description);
      } else {
        message.reply('Invalid command. See !help');
      }
    } catch (e) {
      message.reply('Something went wrong. Did you put the username correctly?');
      console.error(e);
    }
  }

  private _fileReport(message: IMessage, user_handle: string, description?: string) {
    const rep: Report = new Report(
      message.guild,
      user_handle,
      description,
      message.attachments.map((e) => e.url)
    );

    this.container.reportService.addReport(rep);

    return rep;
  }

  private async _sendWarning(rep: Report) {
    await this._sendModMessageToUser(
      'Hey there, this is a courtesy warning that you violated the code of conduct and a report was filed with me.',
      rep
    );
  }

  private async _sendBan(rep: Report) {
    await this.container.guildService.get().ban(rep.user, { reason: rep.description });

    await this._sendModMessageToUser('Hey there. You have been banned', rep);
  }

  private async _sendModMessageToUser(message: string, rep: Report) {
    await this.container.clientService.users
      .get(rep.user)
      ?.send(`${message} Reason: ${rep.description || 'nothing specific'}`, {
        files: rep.attachments,
      });
  }

  private async _handleAddReport(message: IMessage, user_handle: string, description?: string) {
    const rep = this._fileReport(message, user_handle, description);
    message.reply(`Added report on ${user_handle}: ${rep.toString()}`);
  }

  private async _handleListReport(message: IMessage, user_handle: string) {
    const msg = await this.container.reportService.generateReport(message.guild, user_handle);
    message.reply(
      msg.length === 0
        ? `No reports on ${user_handle}`
        : `***Here are the reports on ${user_handle}***\n${msg}`
    );
  }

  private async _handleIssueWarning(message: IMessage, user_handle: string, description?: string) {
    const rep = this._fileReport(message, user_handle, description);

    await this._sendWarning(rep);

    message.reply(`Added report and warned ${user_handle}: ${rep.toString()}`);
  }

  private async _handleIssueBan(message: IMessage, user_handle: string, description?: string) {
    const rep = this._fileReport(
      message,
      user_handle,
      `BANNED for ${description || 'no specific reason'}`
    );

    await this._sendBan(rep);

    message.reply(`Banned ${user_handle}: ${rep.toString()}`);
  }
}
