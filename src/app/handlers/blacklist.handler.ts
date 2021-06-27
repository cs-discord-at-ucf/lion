import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage, ClassType } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

interface ILinkLabel {
  regex: RegExp;
  label: string;
}

export class BlacklistHandler implements IHandler {
  private _expressions: ILinkLabel[] = [
    { regex: /discord\.gg/, label: 'discord' },
    { regex: /group(\.me|me\.com)/, label: 'GroupMe' },
    { regex: /chegg\.com/, label: 'Chegg' },
    { regex: /coursehero\.com/, label: 'CourseHero' },
    { regex: /quizlet\.com/, label: 'Quizlet' },
  ];

  private _whitelistedChannels = new Set([Constants.Channels.Public.Clubs]);
  constructor(public container: IContainer) {}

  public execute(message: IMessage): void {
    const channel = message.channel as TextChannel;
    const member = message.member;
    if (!member) {
      return;
    }

    // Whitelist moderators
    if (this.container.userService.hasRole(member, 'Moderator')) {
      return;
    }

    if (this._whitelistedChannels.has(channel.name)) {
      return;
    }

    this._expressions.forEach(({ regex, label }) => {
      if (message.content.toLowerCase().match(regex)) {
        message.author.send(
          `Please do not share \`${label}\` links in the \`${
            this.container.guildService.get().name
          }\` server.`
        );
        this.container.messageService.sendBotReportOnMessage(message);
        const rep = new Moderation.Report(
          this.container.guildService.get(),
          message.author.id,
          `Shared a ${label} link.`
        );
        this.container.modService.fileReport(rep);
        message.delete();
        return;
      }
    });

    const isClassChannel = this.container.classService.getClasses(ClassType.ALL).has(channel.name);
    const hasBackticks = message.content.toLowerCase().match(/```/);
    const hasAttachment = message.attachments.size;

    if (isClassChannel && (hasBackticks || hasAttachment)) {
      this.container.messageService.sendBotReportOnMessage(message);
    }
  }
}
