import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Handler } from '../../common/handler';
import { IContainer, IMessage, ClassType } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

interface ILinkLabel {
  regex: RegExp;
  label: string;
}

export class BlacklistHandler extends Handler {
  public name: string = 'Blacklist';
  private _expressions: ILinkLabel[] = [
    { regex: /discord\.gg/, label: 'discord' },
    { regex: /group(\.me|me\.com)/, label: 'GroupMe' },
    { regex: /chegg\.com/, label: 'Chegg' },
    { regex: /coursehero\.com/, label: 'CourseHero' },
  ];

  private _whitelistedChannels = new Set([Constants.Channels.Public.Clubs]);

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const channel = message.channel as TextChannel;
    const member = message.member;
    if (!member) {
      return;
    }

    // Whitelist moderators
    if (this.container.userService.hasRole(member, Constants.Roles.Moderator)) {
      return;
    }

    if (this.container.userService.hasRole(member, 'Professor')) {
      return;
    }

    if (this._whitelistedChannels.has(channel.name)) {
      return;
    }

    const expressionsFound = this._expressions.filter((ex) =>
      message.content.toLowerCase().match(ex.regex)
    );

    // Check for sus messages that didnt have links
    if (!expressionsFound.length) {
      const isClassChannel = this.container.classService
        .getClasses(ClassType.ALL)
        .has(channel.name);
      const hasBackticks = message.content.toLowerCase().match(/```/);
      const hasAttachment = message.attachments.size;
      const messageIsLong = message.content.length >= 400;

      if (isClassChannel && (hasBackticks || hasAttachment || messageIsLong)) {
        await this.container.messageService.sendBotReportOnMessage(message);
        console.log('REPORTING');
      }
      return;
    }

    // It only matters if there is at least one found
    const [expression] = expressionsFound;
    const { label } = expression;

    await message.author
      .send(
        `Please do not share \`${label}\` links in the \`${
          this.container.guildService.get().name
        }\` server.`
      )
      .catch((e) => this.container.loggerService.warn(e));

    await this.container.messageService.sendBotReportOnMessage(message);
    const rep = new Moderation.Report(
      this.container.guildService.get(),
      message.author.tag,
      `Shared a ${label} link.`
    );
    await this.container.modService.fileReport(rep);
    await message.delete().catch(() => {});
  }
}
