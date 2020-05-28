import { Guild, Snowflake } from 'discord.js';

function resolveUser(guild: Guild, user: string): Snowflake {
  return guild.members.find((gm) => `${gm.user.username}#${gm.user.discriminator}` === user).user
    .id;
}

export class Report {
  public guild: Guild;
  public user: Snowflake;
  public description?: string;
  public attachments?: string[];

  constructor(guild: Guild, user: string, description?: string, attachments?: string[]) {
    this.guild = guild;

    const found_user = resolveUser(this.guild, user);

    if (!found_user) {
      throw `Could not resolve ${user} to a user`;
    }

    this.user = found_user;

    this.description = description;
    this.attachments = attachments;
  }

  public toString() {
    return `\`${this.description}\`: [${this.attachments?.join(', ')}]`;
  }
}

class Reports {
  public userToReportList: Map<Snowflake, Report[]> = new Map();

  public async addReport(report: Report) {
    const existing_reports = this.userToReportList.get(report.user) || [];

    existing_reports.push(report);

    this.userToReportList.set(report.user, existing_reports);
  }

  public async getUserReports(user: Snowflake) {
    return this.userToReportList.get(user) || [];
  }
}

export class ReportService {
  private _reports_by_Guild: Map<Guild, Reports> = new Map();

  constructor() {}

  public async addReport(report: Report) {
    const orig_reports_list = this._reports_by_Guild.get(report.guild) || new Reports();

    await orig_reports_list.addReport(report);

    this._reports_by_Guild.set(report.guild, orig_reports_list);
  }

  public async generateReport(guild: Guild, user: string) {
    const reports_for_guild = this._reports_by_Guild.get(guild) || new Reports();

    const real_user = resolveUser(guild, user);

    return (await reports_for_guild.getUserReports(real_user)).map((r) => r.toString()).join('\n');
  }
}
