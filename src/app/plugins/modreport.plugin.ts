import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

export class ModReportPlugin extends Plugin {
  public name: string = 'Mod Report Plugin';
  public description: string = 'add a report against a user';
  public usage: string = 'modreport <add/list> <username#numbers> [screenshots...]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;
  public commandPattern: RegExp = /(add|list|warn|ban)\s+([^#]+#\d{4})\s*(.*)/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const match_arr = args.join(' ').match(this.commandPattern);

    if (!match_arr) {
      message.reply('Invalid syntax.');
      return;
    }

    const [sub_command, user_handle, description] = match_arr.slice(1);

    try {
      if (sub_command === 'add') {
        await this._handleAddReport(message, user_handle, description);
      } else if (sub_command === 'list') {
        await this._handleListReport(message, user_handle);
      } else if (sub_command === 'warn') {
        await this._handleIssueWarning(message, user_handle, description);
      } else if (sub_command === 'ban') {
        await this._handleIssueBan(message, user_handle, description);
      }
    } catch (e) {
      message.reply('Something went wrong. Did you put the username correctly?');
      this.container.loggerService.error(e);
    }
  }

  private _createReport(message: IMessage, user_handle: string, description?: string) {
    const rep: Moderation.Report = new Moderation.Report(
      this.container.guildService.get(),
      user_handle,
      description,
      message.attachments.map((e) => e.url)
    );

    return rep;
  }

  private async _handleAddReport(message: IMessage, user_handle: string, description?: string) {
    const rep = this._createReport(message, user_handle, description);
    message.reply(await this.container.modService.fileReport(rep));
  }

  private async _handleListReport(message: IMessage, user_handle: string) {
    message.reply(
      await this.container.modService.getModerationSummary(
        this.container.guildService.get(),
        user_handle
      )
    );
  }

  private async _handleIssueWarning(message: IMessage, user_handle: string, description?: string) {
    const rep = this._createReport(message, user_handle, description);
    message.reply(await this.container.modService.fileWarning(rep));
  }

  private async _handleIssueBan(message: IMessage, user_handle: string, description?: string) {
    const rep = this._createReport(message, user_handle, description);
    message.reply(await this.container.modService.fileBan(rep));
  }
}
