import { Guild, Snowflake } from 'discord.js';
import { StorageService } from './storage.service';

function resolveUser(guild: Guild, user: string): Snowflake | undefined {
  try {
    return guild.members.find((gm) => `${gm.user.username}#${gm.user.discriminator}` === user).user
      .id;
  } catch (_) {
    return undefined;
  }
}

function serialiseReportForMessage(report: Report): string {
  return `\`${
    report.description && report.description.length ? report.description : 'no description'
  }\`: [${
    report.attachments && report.attachments.length
      ? report.attachments.join(', ')
      : 'no attachment'
  }] at ${new Date(report.timeStr).toLocaleString('en-US')}`;
}

export class Report {
  public guild: Snowflake;
  public user: Snowflake;
  public description?: string;
  public attachments?: string[];
  public timeStr: string;

  constructor(guild: Guild, user: string, description?: string, attachments?: string[]) {
    this.guild = guild.id;

    const found_user = resolveUser(guild, user);

    if (!found_user) {
      throw `Could not resolve ${user} to a user`;
    }

    this.user = found_user;

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
    return serialiseReportForMessage(this);
  }
}

export class ReportService {
  constructor(private _storageService: StorageService) {}

  public async addReport(report: Report) {
    try {
      await (await this._storageService.getCollections())?.modreports?.insertOne(report);
    } catch (e) {
      console.error(e);
    }
  }

  public async generateReport(guild: Guild, user: string) {
    const res =
      (await (await this._storageService.getCollections())?.modreports
        ?.find({ guild: guild.id, user: resolveUser(guild, user) }, { limit: 10 })
        .toArray()) || [];

    const reply = res.map((r: Report) => serialiseReportForMessage(r));
    return reply.join('\n') || 'none';
  }
}
