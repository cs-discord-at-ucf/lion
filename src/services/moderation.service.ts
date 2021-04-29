import { Guild, Snowflake, MessageEmbed, GuildChannel, TextChannel, User } from 'discord.js';
import { StorageService } from './storage.service';
import { ObjectId } from 'mongodb';
import Environment from '../environment';
import { ClientService } from './client.service';
import { GuildService } from './guild.service';
import { LoggerService } from './logger.service';
import { IMessage, Maybe } from '../common/types';
import Constants from '../common/constants';

export namespace Moderation {
  export namespace Helpers {
    export async function resolveUser(guild: Guild, tag: string): Promise<Maybe<Snowflake>> {
      try {
        const id = guild.members.cache.find((gm) => gm.user.tag === tag)?.user.id;
        if (id) {
          return id;
        }

        //If the lookup didnt work, they may be banned
        //So check banned list
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
      return `\`${report.description || 'no description'}\`: [${attachments}] at ${new Date(
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

  export interface IModerationBan {
    user: Snowflake;
    guild: Snowflake;
    date: Date;
    active: boolean;
    reason: string;
    reportId?: ObjectId;
    _id: ObjectId;
  }

  export interface IModerationWarning {
    user: Snowflake;
    guild: Snowflake;
    date: Date;
    reportId?: ObjectId;
    _id: ObjectId;
  }

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
        throw `Need either a description or attachment(s).`;
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
    private _storageService: StorageService,
    private _clientService: ClientService,
    private _guildService: GuildService,
    private _loggerService: LoggerService
  ) {}

  // Files a report but does not warn the subject.
  public async fileReport(report: Moderation.Report): Promise<string> {
    const res = await this._insertReport(report);
    if (res) {
      return `Added report: ${Moderation.Helpers.serialiseReportForMessage(report)}`;
    } else {
      return `Could not insert report.`;
    }
  }

  public async fileAnonReportWithTicketId(ticket_id: string, message: IMessage) {
    // overwrite with our user to protect reporter
    message.author = this._clientService.user as User;

    this._loggerService.info(`Filing report with ticket_id ${ticket_id}`);

    const userOffenseChan = this._guildService
      .get()
      .channels.cache.find((c) => c.name === Constants.Channels.Staff.UserOffenses);

    if (!userOffenseChan) {
      this._loggerService.error('Could not file report for ' + message);
      return undefined;
    }

    await (userOffenseChan as TextChannel)
      .send(
        `:rotating_light::rotating_light: ANON REPORT Ticket ${ticket_id} :rotating_light::rotating_light:\n ${message.content}`,
        {
          files: message.attachments.map((a) => a.url),
        }
      )
      .catch((e) => this._loggerService.error(e));

    return ticket_id;
  }

  public async fileAnonReport(message: IMessage): Promise<Maybe<string>> {
    return await this.fileAnonReportWithTicketId(this.generateTicketId(message), message);
  }

  public async respondToAnonReport(ticket_id: string, message: IMessage): Promise<Maybe<string>> {
    const decoded = this.tryDecodeTicketId(ticket_id);

    if (!decoded) {
      return undefined;
    }

    const [_, user_id] = decoded;
    const user = this._guildService.get().members.cache.get(user_id);

    if (!user) {
      this._loggerService.error(
        `respondToAnonReport: Could not resolve ${user_id} to a Guild member.`
      );
      return undefined;
    }

    await user
      .send(`Response to your anonymous report ticket ${ticket_id}:\n ${message.content}`, {
        files: message.attachments.map((a) => a.url),
      })
      .catch((e) => this._loggerService.error(e));

    return ticket_id;
  }

  public generateTicketId(message: IMessage): string {
    return `${message.id}x${message.author?.id}`;
  }

  public isTicketId(maybe_ticket_id: string): boolean {
    return !!this.tryDecodeTicketId(maybe_ticket_id);
  }

  private tryDecodeTicketId(ticket_id: string): Maybe<string[]> {
    const _REPORT_ID: RegExp = /([^x]+)x([0-9]+)/;
    const match_report_id = ticket_id.match(_REPORT_ID);

    if (!match_report_id) {
      return undefined;
    }

    const [_, message_id, user_id] = match_report_id;

    return [message_id, user_id];
  }

  // Files a report and warns the subject.
  public async fileWarning(report: Moderation.Report): Promise<string> {
    const member = this._guildService.get().members.cache.get(report.user);
    if (member?.user.bot) {
      return 'You cannot warn a bot.';
    }

    const fileReportResult: Promise<ObjectId | undefined> = this._insertReport(report);

    const warnings = (await this._storageService.getCollections()).modwarnings;

    const recentWarnings =
      (await warnings
        ?.find({ user: report.user, guild: report.guild })
        .sort({ date: -1 })
        .limit(Environment.WarningsThresh)
        .toArray()) || [];

    const beginningOfWarningRange = new Date();
    beginningOfWarningRange.setDate(beginningOfWarningRange.getDate() - Environment.WarningsRange);

    const shouldEscalateToBan =
      recentWarnings.length >= Environment.WarningsThresh &&
      recentWarnings.reduce((acc, x) => acc && x.date >= beginningOfWarningRange, true);

    if (shouldEscalateToBan) {
      this.fileBan(report);
      return `User has been warned too many times. Escalate to ban.`;
    }

    await warnings?.insertOne({
      user: report.user,
      guild: report.guild,
      date: new Date(),
      reportId: await fileReportResult,
    });

    this._sendModMessageToUser('A warning has been issued. ', report);
    return `User warned: ${Moderation.Helpers.serialiseReportForMessage(report)}`;
  }

  // Files a report and bans the subject.
  public async fileBan(report: Moderation.Report) {
    if (await this._isUserCurrentlyBanned(report.guild, report.user)) {
      return `User is already banned.`;
    }

    const bans = (await this._storageService.getCollections())?.modbans;

    await bans?.insertOne({
      guild: report.guild,
      user: report.user,
      date: new Date(),
      active: true,
      reason: report.description || '<none>',
      reportId: await this._insertReport(report),
    });

    try {
      await this._guildService
        .get()
        .members.cache.get(report.user)
        ?.send(
          `You have been banned for one week for ${report.description ||
            report.attachments?.join(',')}`
        )
        .then(() => {
          return this._guildService.get().members.ban(report.user, { reason: report.description });
        });
    } catch (e) {
      return 'Issue occurred trying to ban user.';
    }

    return `Banned User`;
  }

  // Produces a report summary.
  // TODO: add warnings and bans metrics.
  public async getModerationSummary(
    guild: Guild,
    username: string
  ): Promise<MessageEmbed | string> {
    const collections = await this._storageService.getCollections();
    const id = await Moderation.Helpers.resolveUser(guild, username);

    if (!id) {
      return 'No such user found.';
    }

    const modreports = collections?.modreports;
    const modwarnings = collections?.modwarnings;
    const modbans = collections?.modbans;

    const reports = await modreports?.find({ guild: guild.id, user: id });
    const warnings = await modwarnings?.find({ guild: guild.id, user: id });
    const bans = await modbans?.find({ guild: guild.id, user: id });

    const mostRecentBan =
      (await bans
        ?.sort({ date: -1 })
        .limit(1)
        .toArray()) || [];

    let banStatus = '';
    if (mostRecentBan.length && mostRecentBan[0].active) {
      banStatus = `Banned since ${mostRecentBan[0].date.toLocaleString()}`;
    } else {
      banStatus = 'Not banned';
    }

    const mostRecentWarning =
      (await warnings
        ?.sort({ date: -1 })
        .limit(1)
        .toArray()) || [];

    let lastWarning = '<none>';
    if (mostRecentWarning.length) {
      const _id = mostRecentWarning[0].reportId;
      const rep = await modreports?.findOne({ _id });
      if (rep) {
        lastWarning = Moderation.Helpers.serialiseReportForMessage(rep);
      }
    }

    const reply = new MessageEmbed();

    reply.setTitle('Moderation Summary on ' + username);

    reply.addField('Total Reports', await reports?.count());
    reply.addField('Total Warnings', await warnings?.count());
    reply.addField('Ban Status', banStatus);
    reply.addField('Last warning', lastWarning);

    reply.setTimestamp(new Date());
    reply.setColor('#ff3300');

    return reply;
  }

  public async checkForScheduledUnBans() {
    this._loggerService.info('Running UnBan');

    const modbans = (await this._storageService.getCollections())?.modbans;

    if (!modbans) {
      this._loggerService.info('No modbans DB. Skipping this run of checkForScheduledUnBans');
      return;
    }

    const guild = this._guildService.get();
    const bulk = modbans.initializeUnorderedBulkOp();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const unbans = await modbans
        .find({
          guild: guild.id,
          active: true,
          date: { $lte: new Date(sevenDaysAgo.toISOString()) },
        })
        .map(async (ban) => {
          this._loggerService.info('Unbanning user ' + ban.user);
          try {
            await guild.members.unban(ban.user);
          } catch (e) {
            this._loggerService.error('Failed to unban user ' + ban.user, e);
          }
          bulk.find({ _id: ban._id }).updateOne({ $set: { active: false } });
        })
        .toArray();

      await Promise.all(unbans);

      if (unbans.length == 0) {
        this._loggerService.info('No UnBans to perform.');
        return;
      }

      await bulk.execute();
    } catch (e) {
      this._loggerService.error(e);
    }
  }

  /// Bans the user from reading/sending
  /// in specified channels.
  /// Files a report about it.
  public async channelBan(
    guild: Guild,
    username: string,
    channels: GuildChannel[]
  ): Promise<GuildChannel[]> {
    const id = await Moderation.Helpers.resolveUser(guild, username);
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
        channel
          .createOverwrite(id, {
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
      this._insertReport(
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

  private async _insertReport(report: Moderation.Report): Promise<ObjectId | undefined> {
    return (await (await this._storageService.getCollections())?.modreports?.insertOne(report))
      ?.ops[0]._id;
  }

  private async _isUserCurrentlyBanned(guild: Snowflake, user: Snowflake) {
    const bans = (await this._storageService.getCollections())?.modbans;

    const userBan = await bans?.findOne({ guild, user, active: true });

    return userBan?.active;
  }

  private async _sendModMessageToUser(message: string, rep: Moderation.Report) {
    await this._clientService.users.cache
      .get(rep.user)
      ?.send(`${message} Reason: ${rep.description || '<none>'}`, {
        files: rep.attachments && JSON.parse(JSON.stringify(rep.attachments)),
      });
  }
}
