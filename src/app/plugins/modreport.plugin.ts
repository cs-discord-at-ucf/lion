import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, RoleType } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

export default class ModReportPlugin extends Plugin {
  public commandName: string = 'modreport';
  public name: string = 'Mod Report Plugin';
  public description: string =
    '`Add`: Adds a report to a user.\n' +
    '`List:` Gets a small summary of a user.\n' +
    "`Full:` Gets a downloadable, full report on all of a user's offences.";
  public usage: string = 'modreport <add/list/full> <username#numbers> [screenshots...]';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override minRoleToRun: RoleType = RoleType.Moderator;
  public override commandPattern: RegExp = /(add|list|warn|ban|full)\s.+/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [sub_command, user_handle, description] = args;

    try {
      if (sub_command === 'add') {
        await this._handleAddReport(message, user_handle, description);
      } else if (sub_command === 'warn') {
        await this._handleIssueWarning(message, user_handle, description);
      } else if (sub_command === 'ban') {
        await this._handleIssueBan(message, user_handle, description);
      } else if (sub_command === 'list') {
        await this._handleListReport(message, user_handle);
        return;
      } else if (sub_command === 'full') {
        await this._handleFullList(message, user_handle);
        return;
      }

      // Send a list report after an action
      await this._handleListReport(message, user_handle);
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
    this.container.messageService.sendStringOrEmbed(
      message.channel as TextChannel,
      await this.container.modService.getModerationSummary(
        this.container.guildService.get(),
        user_handle
      )
    );
  }

  private async _handleFullList(message: IMessage, user_handle: string) {
    try {
      await message.reply({
        content: `Full Report for ${user_handle}`,
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
    message.reply(await this.container.modService.fileBan(rep, true));
  }
}
