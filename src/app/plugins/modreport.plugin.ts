import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, Maybe, RoleType } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

export default class ModReportPlugin extends Plugin {
  public commandName: string = 'modreport';
  public name: string = 'Mod Report Plugin';
  public description: string =
    '`Add`: Adds a report to a user.\n' +
    '`List:` Gets a small summary of a user.\n' +
    "`Full:` Gets a downloadable, full report on all of a user's offences.";
  public usage: string =
    'modreport add  <tag | id> <reason> <screenshot>\n' +
    'modreport warn <tag | id> <reason> <screenshot>\n' +
    'modreport list <tag | id>\n' +
    'modreport full <tag | id>';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override minRoleToRun: RoleType = RoleType.Moderator;
  public override commandPattern: RegExp =
    /(add|list|warn|ban|full)\s+(([^#]+#\d{4})|\d{17,18})\s*(.*)/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const parsed = this.parseArgs(args);
    if (!parsed) {
      await message.reply('Invalid syntax'); // With a good regex, this wont happen
      return;
    }

    const { subCommand, givenHandle, description } = parsed;
    try {
      if (subCommand === 'add') {
        await this._handleAddReport(message, givenHandle, description);
      } else if (subCommand === 'warn') {
        await this._handleIssueWarning(message, givenHandle, description);
      } else if (subCommand === 'ban') {
        await this._handleIssueBan(message, givenHandle, description);
      } else if (subCommand === 'list') {
        await this._handleListReport(message, givenHandle);
        return;
      } else if (subCommand === 'full') {
        await this._handleFullList(message, givenHandle);
        return;
      }

      // Send a list report after an action
      await this._handleListReport(message, givenHandle);
    } catch (e) {
      await message.reply('Something went wrong. Did you put the username correctly?');
      this.container.loggerService.error(e);
    }
  }

  public parseArgs(args: string[]): Maybe<Moderation.IModReportRequest> {
    const match_arr = args.join(' ').match(this.commandPattern);
    if (!match_arr) {
      return null;
    }

    const [subCommand, userHandle, id, description] = match_arr.slice(1);

    const givenHandle = userHandle ?? id;
    return { subCommand, givenHandle, description };
  }

  private async _createReport(message: IMessage, user_handle: string, description?: string) {
    const id = await Moderation.Helpers.resolveToID(this.container.guildService.get(), user_handle);

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
