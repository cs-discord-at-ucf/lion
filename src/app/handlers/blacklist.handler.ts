import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage, ClassType } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

interface LinkLabel {
  regex: RegExp;
  label: string;
}

export class BlacklistHandler implements IHandler {
  private _expressions: LinkLabel[] = [
    { regex: /discord\.gg/, label: 'discord' },
    { regex: /group\s?me/, label: 'GroupMe' },
    { regex: /chegg\.com/, label: 'Chegg' },
    { regex: /coursehero\.com/, label: 'CourseHero' },
    { regex: /quizlet\.com/, label: 'Quizlet' },
  ];

  private _whitelistedChannels = new Set([Constants.Channels.Public.Clubs]);
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const channel = message.channel as TextChannel;

    if (this._whitelistedChannels.has(channel.name)) {
      return;
    }

    this._expressions.forEach(({ regex, label }) => {
      if (message.content.toLowerCase().match(regex)) {
        message.author.send(
          `Please do not share \`${label}\` links in the \`${message.guild.name}\` server.`
        );
        this.container.messageService.sendBotReport(message);
        const rep = new Moderation.Report(
          message.guild,
          message.author.username,
          `${message.author.username} shared a ${label} link.`
        );
        this.container.modService.fileReport(rep);
        return;
      }
    });

    if (message.content.toLowerCase().match(/ucf.zoom.us/)) {
      message.author.send(
        'Hey, we are currently not allowing for UCF Zoom links to be posted within the Discord.'
      );
      this.container.messageService.sendBotReport(message);
      message.delete();
      return;
    }

    const isClassChannel = this.container.classService.getClasses(ClassType.ALL).has(channel.name);
    const hasBackticks = message.content.toLowerCase().match(/```/);
    const hasAttachment = message.attachments.size;

    if (isClassChannel && (hasBackticks || hasAttachment)) {
      this.container.messageService.sendBotReport(message);
    }
  }
}
