import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage, ClassType } from '../../common/types';
import { Moderation } from '../../services/moderation.service';
import { readFileSync } from 'fs';
//Import VaderSentiment
const vader = require('vader-sentiment');
//Try to open the black listed words file
let blacklistedWords: string[];
try {
  blacklistedWords = (readFileSync('src/common/wordblacklist.txt', 'utf-8')).split(/\r?\n/);
} catch (error) {
  blacklistedWords = [];
  console.error(error);
}

interface LinkLabel {
  regex: RegExp;
  label: string;
}
// List of all Blacklisted Links in the server
export class BlacklistHandler implements IHandler {
  private _expressions: LinkLabel[] = [
    { regex: /discord\.gg/, label: 'discord' },
    { regex: /group\s?me/, label: 'GroupMe' },
    { regex: /chegg\.com/, label: 'Chegg' },
    { regex: /coursehero\.com/, label: 'CourseHero' },
    { regex: /quizlet\.com/, label: 'Quizlet' },
    { regex: /ucf\.zoom\.us/, label: 'Zoom' },
  ];

  private _whitelistedChannels = new Set([Constants.Channels.Public.Clubs]);
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const channel = message.channel as TextChannel;
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(message.content);

    //Word Black List
    if (blacklistedWords.some((blockedWords) => 
      message.content.toLocaleLowerCase().includes(blockedWords))) {
        this.container.messageService.sendBotReport(message, "Blocked Word");
        message.delete();
        return;
      }

    //VaderSentiment Negativity Check
    if (intensity['compound'] < 0 ) {
      this.container.messageService.sendBotReport(message, "Negativity");
      return;
    }

    //Link Checking
    this._expressions.forEach(({ regex, label }) => {
      if (message.content.toLowerCase().match(regex) && !(this._whitelistedChannels.has(channel.name))) {
        message.author.send(
          `Please do not share \`${label}\` links in the \`${message.guild.name}\` server.`
        );
        this.container.messageService.sendBotReport(message, "Link Sharing");
        const rep = new Moderation.Report(
          message.guild,
          message.author.tag,
          `Shared a ${label} link.`
        );
        this.container.modService.fileReport(rep);
        return;
      }
    });

    // Code and Screenshot sharing in Classes
    const isClassChannel = this.container.classService.getClasses(ClassType.ALL).has(channel.name);
    const hasBackticks = message.content.toLowerCase().match(/```/);
    const hasAttachment = message.attachments.size;

    if (isClassChannel && (hasBackticks || hasAttachment)) {
      this.container.messageService.sendBotReport(message, "Code");
      return;
    }
  }
}
