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

    // Standardize all forms indentification to an ID
    const id = await Moderation.Helpers.resolveToID(this.container.guildService.get(), givenHandle);

    if (!id) {
      await message.reply('Could not find user with that handle');
      return;
    }

    try {
      if (subCommand === 'add') {
        await this._handleAddReport(message, id, description);
      } else if (subCommand === 'warn') {
        await this._handleIssueWarning(message, id, description);
      } else if (subCommand === 'ban') {
        await this._handleIssueBan(message, id, description);
      } else if (subCommand === 'list') {
        await this._handleListReport(message, id);
        return;
      } else if (subCommand === 'full') {
        await this._handleFullList(message, id);
        return;
      }

      // Send a list report after an action
      await this._handleListReport(message, id);
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

  private _createReport(message: IMessage, id: string, description?: string) {
    return new Moderation.Report(
      this.container.guildService.get(),
      id,
      description,
      message.attachments.map((e) => e.url)
    );
  }

  private async _handleAddReport(message: IMessage, id: string, description?: string) {
    const rep = this._createReport(message, id, description);
    if (!rep) {
      await message.reply('Error creating report');
      return;
    }
    message.reply(await this.container.modService.fileReport(rep));
  }

  private async _handleListReport(message: IMessage, id: string) {
    this.container.messageService.sendStringOrEmbed(
      message.channel as TextChannel,
      await this.container.modService.getModerationSummary(this.container.guildService.get(), id)
    );
  }

  private async _handleFullList(message: IMessage, id: string) {
    try {
      await message.reply({
        content: `Full Report for ${id}`,
        files: [
          await this.container.modService.getFullReport(this.container.guildService.get(), id),
        ],
      });
    } catch (e) {
      await message.reply(`Error getting report: ${e}`);
    }
  }

  private async _handleIssueWarning(message: IMessage, id: string, description?: string) {
    const rep = this._createReport(message, id, description);
    if (!rep) {
      await message.reply('Error creating report');
      return;
    }
    message.reply(await this.container.modService.fileWarning(rep));
  }

  private async _handleIssueBan(message: IMessage, id: string, description?: string) {
    const rep = this._createReport(message, id, description);
    if (!rep) {
      await message.reply('Error creating report');
      return;
    }
    message.reply(await this.container.modService.fileBan(rep, true));
  }
}
