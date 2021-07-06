import { Guild, Snowflake, MessageEmbed, GuildChannel, TextChannel, User } from 'discord.js';
import mongoose, { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ClientService } from './client.service';
import { GuildService } from './guild.service';
import { IMessage, Maybe } from '../common/types';
import Constants from '../common/constants';
import * as fs from 'fs';
import { WarningService } from './warning.service';
import {
  ModerationBanModel,
  ModerationReportModel,
  ModerationWarningModel,
} from '../schemas/moderation.schema';
import winston from 'winston';

export namespace Moderation {
  export namespace Helpers {
    export async function resolveUser(guild: Guild, tag: string): Promise<Maybe<Snowflake>> {
      try {
        const id = guild.members.cache.find((gm) => gm.user.tag === tag)?.user.id;
        if (id) {
          return id;
        }

        // If the lookup didn't work, they may be banned
        // So check banned list
        const bannedUsers = await guild.fetchBans();
        const user = bannedUsers.filter((u) => u.user.tag === tag).first();
        return user?.user.id;
      } catch (_) {
        return undefined;
      }
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
    private _warningService: WarningService
  ) {}

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

    winston.info(`Filing report with ticket_id ${ticket_id}`);

    const userOffenseChan = this._guildService
      .get()
      .channels.cache.find((c) => c.name === Constants.Channels.Staff.UserOffenses);

    if (!userOffenseChan) {
      winston.error('Could not file report for ' + message);
      return undefined;
    }

    await (userOffenseChan as TextChannel)
      .send(
        `:rotating_light::rotating_light: ANON REPORT Ticket ${ticket_id} :rotating_light::rotating_light:\n ${message.content}`,
        {
          files: message.attachments.map((a) => a.url),
        }
      )
      .catch(winston.error);

    return ticket_id;
  }

  public async fileAnonReport(message: IMessage): Promise<Maybe<string>> {
    return await this.fileAnonReportWithTicketId(this.generateTicketId(message), message);
  }

  public async respondToAnonReport(ticket_id: string, message: IMessage): Promise<Maybe<string>> {
    const decoded = this._tryDecodeTicketId(ticket_id);

    if (!decoded) {
      return undefined;
    }

    const [, user_id] = decoded;
    const user = this._guildService.get().members.cache.get(user_id);

    if (!user) {
      winston.error(
        `respondToAnonReport: Could not resolve ${user_id} to a Guild member.`
      );
      return undefined;
    }

    await user
      .send(`Response to your anonymous report ticket ${ticket_id}:\n ${message.content}`, {
        files: message.attachments.map((a) => a.url),
      })
      .catch(winston.error);

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
    const member = this._guildService.get().members.cache.get(report.user);
    if (member?.user.bot) {
      return 'You cannot warn a bot.';
    }

    const fileReportResult: Maybe<ObjectId> = await this._insertReport(report);

    const warningsThreshold = +(process.env.WARNINGS_THRESH ?? 3);
    const recentWarnings =
      (await ModerationWarningModel.find({ user: report.user, guild: report.guild })
        .sort({ date: -1 })
        .limit(warningsThreshold)) ?? [];

    const beginningOfWarningRange = new Date();
    const warningRange = +(process.env.WARNINGS_RANGE ?? 14);
    beginningOfWarningRange.setDate(beginningOfWarningRange.getDate() - warningRange);

    const shouldEscalateToBan =
      recentWarnings.length >= warningsThreshold &&
      recentWarnings.reduce((acc, x) => acc && x.date >= beginningOfWarningRange, true);

    if (shouldEscalateToBan) {
      return (
        'User has been warned too many times. Escalate to ban.\n' +
        `Result: ${await this._fileBan(report, fileReportResult)}`
      );
    }

    await ModerationWarningModel.create({
      user: report.user,
      guild: report.guild,
      date: new Date(),
      reportId: fileReportResult,
    });

    await this._warningService.sendModMessageToUser('A warning has been issued. ', report);
    return `User warned: ${Moderation.Helpers.serialiseReportForMessage(report)}`;
  }

  public async fileBan(report: Moderation.Report) {
    const res = await this._insertReport(report);
    return this._fileBan(report, res);
  }

  // Files a report and bans the subject.
  private async _fileBan(report: Moderation.Report, reportResult: Maybe<ObjectId>) {
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
    });

    try {
      await this._guildService
        .get()
        .members.cache.get(report.user)
        ?.send(
          `You have been banned for one week for ${report.description ??
            report.attachments?.join(',')}`
        );
    } catch (e) {
      winston.warn(`Error telling user is banned. ${e}`);
    }

    try {
      await this._guildService.get().members.ban(report.user, { reason: report.description });
    } catch (e) {
      return `Issue occurred trying to ban user. ${e}`;
    }

    return 'Banned User';
  }

  // Produces a report summary.
  // TODO: add warnings and bans metrics.
  public async getModerationSummary(
    guild: Guild,
    username: string
  ): Promise<MessageEmbed | string> {
    const id = await Moderation.Helpers.resolveUser(guild, username);

    if (!id) {
      return 'No such user found.';
    }

    const reports = await ModerationReportModel.find({ guild: guild.id, user: id });
    const warnings = await ModerationWarningModel.find({ guild: guild.id, user: id });
    const banStatus = await this._getBanStatus(guild, id);

    const mostRecentWarning = warnings.sort((a, b) => (a.date > b.date ? -1 : 1));

    let lastWarning = '<none>';
    if (mostRecentWarning.length) {
      const _id = mostRecentWarning[0].reportId;
      const rep = await ModerationReportModel.findOne({ _id });
      if (rep) {
        lastWarning = Moderation.Helpers.serialiseReportForMessage(rep);
      }
    }

    const reply = new MessageEmbed();

    reply.setTitle('Moderation Summary on ' + username);

    reply.addField('Total Reports', reports.length);
    reply.addField('Total Warnings', warnings.length);
    reply.addField('Ban Status', banStatus);
    reply.addField('Last warning', lastWarning);

    reply.setTimestamp(new Date());
    reply.setColor('#ff3300');

    return reply;
  }

  public async getFullReport(guild: Guild, user_handle: string) {
    const id = await Moderation.Helpers.resolveUser(guild, user_handle);
    if (!id) {
      throw new Error('User not found');
    }

    const reports = await ModerationReportModel.find({ guild: guild.id, user: id });
    const warnings = await ModerationWarningModel.find({ guild: guild.id, user: id });
    const banStatus = await this._getBanStatus(guild, id);

    if (!reports) {
      throw new Error('Couldnt get reports');
    }

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
      .replace('BAN_STATUS', banStatus)
      .replace('DYNAMIC_TABLE', table)
      .replace('NUM_REPORTS', reports.length + '')
      .replace('NUM_WARNS', warnings?.length + '' || '0')
      .replace('USER_NAME', user_handle);
    return await this._writeDataToFile(data);
  }

  private async _getBanStatus(guild: Guild, id: string): Promise<string> {
    const mostRecentBan =
      (await ModerationBanModel.find({ guild: guild.id, user: id })
        .sort({ date: -1 })
        .limit(1)) ?? [];

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
    const serializedReport = `Reported on: ${
      report.timeStr
    }<br />Description: ${report.description ?? 'No Description'}`;
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
      winston.error('While writing to ' + filename, err);
    });
    return filename;
  }

  public async checkForScheduledUnBans() {
    winston.info('Running UnBan');

    if (!mongoose.connection.readyState) {
      winston.info('No modbans DB. Skipping this run of checkForScheduledUnBans');
      return;
    }

    const guild = this._guildService.get();
    const bulk = ModerationBanModel.collection.initializeUnorderedBulkOp();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const unbans = await ModerationBanModel.find({
        guild: guild.id,
        active: true,
        date: { $lte: new Date(sevenDaysAgo.toISOString()) },
      }).map(async (ban) => {
        winston.info('Unbanning user ' + ban.user);
        try {
          await guild.members.unban(ban.user);
        } catch (e) {
          winston.error('Failed to unban user ' + ban.user, e);
        }
        bulk.find({ _id: ban._id }).updateOne({ $set: { active: false } });
      });

      await Promise.all(unbans);

      if (unbans.length === 0) {
        winston.info('No UnBans to perform.');
        return;
      }

      await bulk.execute();
    } catch (e) {
      winston.error(e);
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
    const id = await Moderation.Helpers.resolveUser(guild, username);
    const successfulBanChannelList: GuildChannel[] = [];

    if (!id) {
      winston.error(`Failed to resolve ${username} to a user.`);
      return successfulBanChannelList;
    }

    const user = guild.members.cache.get(id)?.user;
    if (!user) {
      winston.error(`Failed to resolve ${username} to a user.`);
      return successfulBanChannelList;
    }

    const channelBanPromises = channels.reduce((acc, channel) => {
      winston.debug(`Taking channel permissions away in ${channel.name}`);
      acc.push(
        channel
          .createOverwrite(id, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false,
          })
          .then(() => successfulBanChannelList.push(channel))
          .catch((ex) => {
            winston.error(
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
      winston.error('Failed to add report about channel ban.', ex);
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
