import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

export default class ModReportPlugin extends Plugin {
  public commandName: string = 'modreport';
  public name: string = 'Mod Report Plugin';
  public description: string = 'add a report against a user';
  public usage: string = 'modreport <add/list> <username#numbers> [screenshots...]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;
  public commandPattern: RegExp = /(add|list|warn|ban|full)\s+([^#]+#\d{4})\s*(.*)/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const match_arr = args.join(' ').match(this.commandPattern);

    if (!match_arr) {
      await message.reply('Invalid syntax.');
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
      } else if (sub_command === 'full') {
        await this._handleFullList(message, user_handle);
      }
    } catch (e) {
      await message.reply('Something went wrong. Did you put the username correctly?');
      this.container.loggerService.error(e);
    }
  }

  private async _createReport(message: IMessage, user_handle: string, description?: string) {
    const id = await Moderation.Helpers.resolveUser(this.container.guildService.get(), user_handle);
    
    if (!id) {
      return;
    }

    const rep: Moderation.Report = new Moderation.Report(
      this.container.guildService.get(),
      id,
      description,
      message.attachments.map((e) => e.url)
    );

    return rep;
  }

  private async _handleAddReport(message: IMessage, user_handle: string, description?: string) {
    const rep = await this._createReport(message, user_handle, description);
    if (!rep) {
      await message.reply('Error creating report');
      return;
    }
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

  private async _handleFullList(message: IMessage, user_handle: string) {
    try {
      await message.reply(`Full Report for ${user_handle}`, {
        files: [
          await this.container.modService.getFullReport(
            this.container.guildService.get(),
            user_handle
          ),
        ],
      });
    } catch (e) {
      await message.reply(`Error getting report: ${e}`);
    }
  }

  private async _handleIssueWarning(message: IMessage, user_handle: string, description?: string) {
    const rep = await this._createReport(message, user_handle, description);
    if (!rep) {
      await message.reply('Error creating report');
      return;
    }
    message.reply(await this.container.modService.fileWarning(rep));
  }

  private async _handleIssueBan(message: IMessage, user_handle: string, description?: string) {
    const rep = await this._createReport(message, user_handle, description);
    if (!rep) {
      await message.reply('Error creating report');
      return;
    }
    message.reply(await this.container.modService.fileBan(rep));
  }
}
