import {
  Guild,
  Snowflake,
  User,
  TextChannel,
  GuildMember,
  MessageEmbed,
  GuildChannel,
} from 'discord.js';
import mongoose, { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ClientService } from './client.service';
import { GuildService } from './guild.service';
import { LoggerService } from './logger.service';
import { IMessage, Maybe } from '../common/types';
import Constants from '../common/constants';
import * as fs from 'fs';
import { WarningService } from './warning.service';
import {
  ModerationBanModel,
  ModerationReportModel,
  ModerationWarningModel,
} from '../schemas/moderation.schema';
import { AltTrackerModel } from '../schemas/alt.schema';

export namespace Moderation {
  export namespace Helpers {
    // Converts any input (tag or id) into an id
    export async function resolveToID(guild: Guild, tag: string): Promise<Maybe<Snowflake>> {
      try {
        const id = (await guild.members.fetch()).find((gm) => gm.user.tag === tag)?.user.id;
        if (id) {
          return id;
        }

        // If the lookup didn't work, they may be banned
        // So check banned list
        const bannedMembers = await guild.bans.fetch();
        const bannedMember = bannedMembers.filter((u) => u.user.tag === tag).first();
        if (bannedMember) {
          return bannedMember.user.id;
        }

        // Check to see if a snowflake was passed in
        if (parseInt(tag)) {
          return tag;
        }

        return null;
      } catch (_) {
        return null;
      }
    }

    // Takes in an id or tag and finds the member
    export async function resolveUser(guild: Guild, tag: string): Promise<Maybe<GuildMember>> {
      // Convert to ID to use for finding the GuildMember
      const id = await resolveToID(guild, tag);
      if (!id) {
        return null;
      }

      return guild.members.cache.get(id);
    }

    export function validateUser(tag: string): boolean {
      const regex: RegExp = /^(([^#]+#\d{4})|\d{17,18})$/;
      return regex.test(tag);
    }

    export function serialiseReportForMessage(report: Report): string {
      const attachments =
        (report.attachments && report.attachments.length && report.attachments.join(', ')) ||
        'no attachment';
      return `\`${report.description ?? 'no description'}\`: [${attachments}] at ${new Date(
        report.timeStr
      ).toLocaleString('en-US')}`;
    }
  }

  export interface IReportSummary {
    reports: Moderation.ModerationReportDocument[];
    warnings: Moderation.ModerationWarningDocument[];
    banStatus: string | false;
  }

  export interface IModerationReport {
    guild: Snowflake;
    user: Snowflake;
    description?: string;
    attachments?: string[];
    timeStr: string;
    _id?: ObjectId;
  }

  export type ModerationReportDocument = IModerationReport & Document;

  export interface IModerationBan {
    user: Snowflake;
    guild: Snowflake;
    date: Date;
    active: boolean;
    reason: string;
    reportId?: ObjectId;
    _id: ObjectId;
  }

  export type ModerationBanDocument = IModerationBan & Document;

  export interface IModerationWarning {
    user: Snowflake;
    guild: Snowflake;
    date: Date;
    reportId?: ObjectId;
    _id: ObjectId;
  }

  export interface IModReportRequest {
    subCommand: string;
    givenHandle: string;
    description: string;
  }

  export type ModerationWarningDocument = IModerationWarning & Document;

  export class Report implements IModerationReport {
    public guild: Snowflake;
    public user: Snowflake;
    public description?: string;
    public attachments?: string[];
    public timeStr: string;

    constructor(guild: Guild, id: string, description?: string, attachments?: string[]) {
      this.guild = guild.id;

      this.user = id;

      this.description = description;
      this.attachments = attachments;

      const has_desc = this.description && this.description.length;
      const has_atta = this.attachments && this.attachments.length;

      if (!has_desc && !has_atta) {
        throw new Error('Need either a description or attachment(s).');
      }

      this.timeStr = new Date().toISOString();
    }

    public toString(): string {
      return Helpers.serialiseReportForMessage(this);
    }
  }
}

export class ModService {
  constructor(
    private _clientService: ClientService,
    private _guildService: GuildService,
    private _loggerService: LoggerService,
    private _warningService: WarningService
  ) {}

  private _QUICK_WARNS_THRESH: number = 3;
  private _QUICK_WARNS_TIMEFRAME: number = 14;

  private _KICK_THRESH: number = 3;
  private _SUSPEND_THRESH: number = 4;
  private _BAN_THRESH: number = 5;

  // Files a report but does not warn the subject.
  public async fileReport(report: Moderation.Report): Promise<string> {
    const res = await this._insertReport(report);
    if (res) {
      return `Added report: ${Moderation.Helpers.serialiseReportForMessage(report)}`;
    } else {
      return 'Could not insert report.';
    }
  }

  public async fileAnonReportWithTicketId(ticket_id: string, message: IMessage) {
    // overwrite with our user to protect reporter
    message.author = this._clientService.user as User;

    this._loggerService.info(`Filing report with ticket_id ${ticket_id}`);

    const userOffenseChan = this._guildService
      .get()
      .channels.cache.find((c) => c.name === Constants.Channels.Staff.ModCommands);

    if (!userOffenseChan) {
      this._loggerService.error('Could not file report for ' + message);
      return undefined;
    }

    await (userOffenseChan as TextChannel)
      .send({
        content: `:rotating_light::rotating_light: ANON REPORT Ticket ${ticket_id} :rotating_light::rotating_light:\n ${message.content}`,
        files: message.attachments.map((a) => a.url),
      })
      .catch((e) => this._loggerService.error(`while filing anonreport ${e}`));

    return ticket_id;
  }

  public fileAnonReport(message: IMessage): Promise<Maybe<string>> {
    return this.fileAnonReportWithTicketId(this.generateTicketId(message), message);
  }

  public async respondToAnonReport(ticket_id: string, message: IMessage): Promise<Maybe<string>> {
    const decoded = this._tryDecodeTicketId(ticket_id);

    if (!decoded) {
      return undefined;
    }

    const [, user_id] = decoded;
    const user = this._guildService.get().members.cache.get(user_id);

    if (!user) {
      this._loggerService.error(
        `respondToAnonReport: Could not resolve ${user_id} to a Guild member.`
      );
      return undefined;
    }

    await user
      .send({
        content: `Response to your anonymous report ticket ${ticket_id}:\n ${message.content}`,
        files: message.attachments.map((a) => a.url),
      })
      .catch((e) => this._loggerService.error(`fail to send anonreport response ${e}`));

    return ticket_id;
  }

  public generateTicketId(message: IMessage): string {
    return `${message.id}x${message.author?.id}`;
  }

  public isTicketId(maybe_ticket_id: string): boolean {
    return !!this._tryDecodeTicketId(maybe_ticket_id);
  }

  private _tryDecodeTicketId(ticket_id: string): Maybe<string[]> {
    const _REPORT_ID: RegExp = /([^x]+)x([0-9]+)/;
    const match_report_id = ticket_id.match(_REPORT_ID);

    if (!match_report_id) {
      return undefined;
    }

    const [, message_id, user_id] = match_report_id;

    return [message_id, user_id];
  }

  // Files a report and warns the subject.
  public async fileWarning(report: Moderation.Report): Promise<string> {
    const member = await this._guildService
      .get()
      .members.fetch() // Cache all the members
      .then((fetched) => fetched.get(report.user));

    if (member?.user.bot) {
      return 'You cannot warn a bot.';
    }

    const fileReportResult: Maybe<ObjectId> = await this._insertReport(report);
    await ModerationWarningModel.create({
      user: report.user,
      guild: report.guild,
      date: new Date(),
      reportId: fileReportResult,
    });

    await this._warningService.sendModMessageToUser('A warning has been issued. ', report);

    const warnings =
      (await ModerationWarningModel.find({ user: report.user, guild: report.guild }).sort({
        date: -1,
      })) ?? [];

    const tempBanResult = await this._checkQuickWarns(warnings, report, fileReportResult);
    if (tempBanResult) {
      return tempBanResult;
    }

    const actionResult = await this._checkNumberOfWarns(warnings, report, fileReportResult);
    return `User warned: ${Moderation.Helpers.serialiseReportForMessage(report)}\n${actionResult}`;
  }

  private async _checkNumberOfWarns(
    warnings: Moderation.ModerationWarningDocument[],
    report: Moderation.Report,
    fileReportResult: Maybe<ObjectId>
  ) {
    const member = this._guildService.get().members.cache.get(report.user);
    if (!member) {
      return "Couldn't find user";
    }

    const numWarns = warnings.length;

    // If below the minimum for punishment, return
    if (numWarns < this._KICK_THRESH) {
      return 'No further action was taken.';
    }

    if (numWarns >= this._KICK_THRESH && numWarns < this._SUSPEND_THRESH) {
      return this._kickUser(member);
    }

    // Suspend user
    if (numWarns >= this._SUSPEND_THRESH && numWarns < this._BAN_THRESH) {
      return this._suspendMember(member);
    }

    return (
      'User has been warned too many times. Escalating to permanent ban.\n' +
      `Result: ${await this._fileBan(report, fileReportResult, true)}`
    );
  }

  private async _checkQuickWarns(
    warns: Moderation.ModerationWarningDocument[],
    report: Moderation.Report,
    fileReportResult: Maybe<ObjectId>
  ): Promise<string | false> {
    const recentWarnings = warns.slice(0, this._QUICK_WARNS_THRESH);
    const beginningOfWarningRange = new Date();
    const warningRange = this._QUICK_WARNS_TIMEFRAME;
    beginningOfWarningRange.setDate(beginningOfWarningRange.getDate() - warningRange);

    const shouldTempBan =
      recentWarnings.length >= this._QUICK_WARNS_THRESH &&
      recentWarnings.reduce((acc, x) => acc && x.date >= beginningOfWarningRange, true);

    if (shouldTempBan) {
      return (
        `User has been warned too many times within ${this._QUICK_WARNS_TIMEFRAME} days. Escalating to temp ban.\n` +
        `Result: ${await this._fileBan(report, fileReportResult, false)}`
      );
    }

    return false;
  }

  public async fileBan(report: Moderation.Report, isPermanent: boolean) {
    const res = await this._insertReport(report);
    return this._fileBan(report, res, isPermanent);
  }

  // Files a report and bans the subject.
  private async _fileBan(
    report: Moderation.Report,
    reportResult: Maybe<ObjectId>,
    isPermanent: boolean
  ) {
    if (await this._isUserCurrentlyBanned(report.guild, report.user)) {
      return 'User is already banned.';
    }

    await ModerationBanModel.create({
      guild: report.guild,
      user: report.user,
      date: new Date(),
      active: true,
      reason: report.description ?? '<none>',
      reportId: reportResult,
      permanent: isPermanent,
    });

    try {
      await this._guildService
        .get()
        .members.cache.get(report.user)
        ?.send(
          `You have been banned ${isPermanent ? 'permanently' : 'for one week'} for ${
            report.description ?? report.attachments?.join(',')
          }`
        );
    } catch (e) {
      this._loggerService.warn(`Error telling user is banned. ${e}`);
    }

    try {
      await this._guildService.get().members.ban(report.user, { reason: report.description });
    } catch (e) {
      return `Issue occurred trying to ban user. ${e}`;
    }

    return 'Banned User';
  }

  private async _kickUser(member: GuildMember) {
    await member.send(
      'You are being kicked for too many warnings\n' +
        `You currently have been warned ${this._KICK_THRESH} times.\n` +
        `After ${this._SUSPEND_THRESH} warnings, you will have restricted access to the server.\n` +
        `After ${this._BAN_THRESH} warnings, you will be banned permanently.`
    );

    try {
      await member.kick();
    } catch (e) {
      this._loggerService.warn(`Tried to kick user ${member.user.username} but couldn't. e: ${e}`);
      return `Error kicking user: ${e}`;
    }

    return 'Kicked user';
  }

  private async _suspendMember(member: GuildMember): Promise<string> {
    try {
      // Remove all roles from user
      await Promise.all(
        member.roles.cache.filter((r) => r.name !== '@everyone').map((r) => member.roles.remove(r))
      );

      const suspendedRole = this._guildService.getRole(Constants.Roles.Suspended);
      await member.roles.add(suspendedRole);
      return `User has crossed threshold of ${this._SUSPEND_THRESH}, suspending user.\n`;
    } catch (e) {
      return `Error suspending user ${e}`;
    }
  }

  // Finds any associated IDs
  // Returns all Alt IDs and the one given
  private async _getAllKnownAltIDs(guild: Guild, givenID: string) {
    const altDoc = (await AltTrackerModel.find({})).find((altDoc) =>
      altDoc.knownIDs.includes(givenID)
    );

    if (altDoc) {
      return altDoc.knownIDs;
    }

    return [givenID];
  }

  private async _getAllReportsWithAlts(
    guild: Guild,
    givenID: string
  ): Promise<Moderation.IReportSummary> {
    const reports: Moderation.ModerationReportDocument[] = [];
    const warnings: Moderation.ModerationWarningDocument[] = [];
    let banStatus: string | false = false; // False, else gives details of ban

    const allKnownIDs = await this._getAllKnownAltIDs(guild, givenID);

    // Add up all reports and warns from alts
    for (const id of allKnownIDs) {
      reports.push(...(await ModerationReportModel.find({ guild: guild.id, user: id })));
      warnings.push(...(await ModerationWarningModel.find({ guild: guild.id, user: id })));

      if (!banStatus) {
        const newBanStatus = await this._getBanStatus(guild, id);
        if (newBanStatus !== 'Not banned') {
          banStatus = newBanStatus;
        }
      }
    }
    return { reports, warnings, banStatus };
  }

  // Produces a report summary.
  public async getModerationSummary(guild: Guild, givenID: string): Promise<MessageEmbed | string> {
    const { reports, warnings, banStatus } = await this._getAllReportsWithAlts(guild, givenID);
    const mostRecentWarning = warnings.sort((a, b) => (a.date > b.date ? -1 : 1));

    let lastWarning = '<none>';
    if (mostRecentWarning.length) {
      const _id = mostRecentWarning[0].reportId;
      const rep = await ModerationReportModel.findOne({ _id });
      if (rep) {
        lastWarning = Moderation.Helpers.serialiseReportForMessage(rep);
      }
    }

    const user = await Moderation.Helpers.resolveUser(guild, givenID);
    if (!user) {
      return 'Could not get member';
    }

    const reply = new MessageEmbed();
    reply.setTitle('Moderation Summary on ' + user.displayName);

    reply.addField('Total Reports', reports.length.toString(), true);
    reply.addField('Total Warnings', warnings.length.toString(), true);
    reply.addField('Ban Status', !!banStatus ? banStatus : 'Not banned', true);
    reply.addField('Last warning', lastWarning);
    reply.addField('Known IDs', (await this._getAllKnownAltIDs(guild, givenID)).join('\n'), true);

    reply.setTimestamp(new Date());
    reply.setColor('#ff3300');

    return reply;
  }

  public async getFullReport(guild: Guild, givenID: string) {
    const { reports, warnings, banStatus } = await this._getAllReportsWithAlts(guild, givenID);

    // Number of Reports > warns
    // Each row has 2 cells, left cell is report, right cell is warn
    const rows: string[][] = new Array(reports.length);
    reports.forEach((report, i) => {
      rows[i] = new Array(2);
      rows[i][0] = this._serializeReportForTable(report);

      const reportID = report._id?.toHexString();
      if (!reportID || !warnings) {
        return;
      }

      const relatedWarn = warnings.filter((w) => w.reportId?.toHexString() === reportID);
      if (!relatedWarn?.length) {
        return;
      }

      rows[i][1] = this._serializeWarningForTable(relatedWarn[0]);
    });

    // Create HTML table
    const table = this._createTableFromReports(rows);

    // Retrieve template
    const defaultHTML = fs.readFileSync('./src/app/__generated__/reportTemplate.html', 'utf8');

    // Replace the placeholders with data we've collected
    const data = defaultHTML
      .replace('BAN_STATUS', !!banStatus ? banStatus : 'Not banned')
      .replace('DYNAMIC_TABLE', table)
      .replace('NUM_REPORTS', reports.length + '')
      .replace('NUM_WARNS', warnings.length + '')
      .replace('USER_NAME', givenID);
    return this._writeDataToFile(data);
  }

  private async _getBanStatus(guild: Guild, id: string): Promise<string> {
    const mostRecentBan =
      (await ModerationBanModel.find({ guild: guild.id, user: id }).sort({ date: -1 }).limit(1)) ??
      [];

    if (mostRecentBan.length && mostRecentBan[0].active) {
      return `Banned since ${mostRecentBan[0].date.toLocaleString()}`;
    }
    return 'Not banned';
  }

  private _createTableFromReports(rows: string[][]) {
    // Wrap each cell in <td> tags
    // Wrap each row in <tr> tags
    return rows
      .map((row: string[]) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('\n')}</tr>`)
      .join('\n');
  }

  private _serializeReportForTable(report: Moderation.IModerationReport): string {
    const serializedReport = `Reported on: ${report.timeStr}<br />Description: ${
      report.description ?? 'No Description'
    }`;
    if (!report.attachments?.length) {
      return serializedReport;
    }

    return `${serializedReport}<br />Attachments: ${report.attachments.map((a) => {
      // If its an image, embed it
      if (a.includes('.png') || a.includes('.jpg')) {
        return `<img src="${a}">`;
      }

      // Return as hyperlink to file
      return `<a href="${a}">Linked File</a>`;
    })}`;
  }

  private _serializeWarningForTable(warning: Moderation.IModerationWarning): string {
    return `Warned on ${warning.date}`;
  }

  private async _writeDataToFile(data: string): Promise<string> {
    const discrim = '' + Math.random();
    const filename = `/tmp/report${discrim}.html`;
    await fs.promises.writeFile(filename, data).catch((err) => {
      this._loggerService.error('While writing to ' + filename, err);
    });
    return filename;
  }

  public async checkForScheduledUnBans() {
    this._loggerService.info('Running UnBan');

    if (!mongoose.connection.readyState) {
      this._loggerService.info('No modbans DB. Skipping this run of checkForScheduledUnBans');
      return;
    }

    const guild = this._guildService.get();
    const bulk = ModerationBanModel.collection.initializeUnorderedBulkOp();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const toUnban = await ModerationBanModel.find({
        guild: guild.id,
        active: true,
        date: { $lte: new Date(sevenDaysAgo.toISOString()) },
      });

      const unbans = toUnban.map(async (ban) => {
        this._loggerService.info('Unbanning user ' + ban.user);
        try {
          await guild.members.unban(ban.user);
        } catch (e) {
          this._loggerService.error('Failed to unban user ' + ban.user, e);
        }
        bulk.find({ _id: ban._id }).updateOne({ $set: { active: false } });
      });

      await Promise.all(unbans);

      if (unbans.length === 0) {
        this._loggerService.info('No UnBans to perform.');
        return;
      }

      await bulk.execute();
    } catch (e) {
      this._loggerService.error(`check for scheduled bans ${e}`);
    }
  }

  // Bans the user from reading/sending
  // in specified channels.
  // Files a report about it.
  public async channelBan(
    guild: Guild,
    username: string,
    channels: GuildChannel[]
  ): Promise<GuildChannel[]> {
    const id = await Moderation.Helpers.resolveToID(guild, username);
    const successfulBanChannelList: GuildChannel[] = [];

    if (!id) {
      this._loggerService.error(`Failed to resolve ${username} to a user.`);
      return successfulBanChannelList;
    }

    const user = guild.members.cache.get(id)?.user;
    if (!user) {
      this._loggerService.error(`Failed to resolve ${username} to a user.`);
      return successfulBanChannelList;
    }

    const channelBanPromises = channels.reduce((acc, channel) => {
      this._loggerService.debug(`Taking channel permissions away in ${channel.name}`);
      acc.push(
        channel.permissionOverwrites
          .create(id, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false,
          })
          .then(() => successfulBanChannelList.push(channel))
          .catch((ex) => {
            this._loggerService.error(
              `Failed to adjust permissions for ${username} in ${channel.name}`,
              ex
            );
          })
      );
      return acc;
    }, [] as Promise<void | number>[]);

    await Promise.all(channelBanPromises);

    try {
      await this._insertReport(
        new Moderation.Report(
          guild,
          id,
          `Took channel permissions away in ${successfulBanChannelList
            .map((c) => c.name)
            .join(', ')}`
        )
      );
    } catch (ex) {
      this._loggerService.error('Failed to add report about channel ban.', ex);
    }

    return successfulBanChannelList;
  }

  private async _insertReport(report: Moderation.Report): Promise<Maybe<ObjectId>> {
    const rep = await ModerationReportModel.create(report);
    return rep?.id;
  }

  private async _isUserCurrentlyBanned(guild: Snowflake, user: Snowflake) {
    const userBan = await ModerationBanModel.findOne({ guild, user, active: true });
    return userBan?.active;
  }
}
