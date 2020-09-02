import { TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage, ClassType } from '../../common/types';
import { Moderation } from '../../services/moderation.service';

export class BlacklistHandler implements IHandler {
  private _expressions: RegExp[] = [ 
    {expression: /discord\.gg/, label: "discord"} ,  
    {expression: /group\s?me/, label "GroupMe" }, 
    {expression: /chegg\.com/, label "Chegg"}, 
    {expression: /coursehero\.com/, label "CourseHero"}, 
    {expression: /quizlet\.com/, label "Quizlet"}
  ];

  private _whitelistedChannels = new Set([Constants.Channels.Public.Clubs]);
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    const channel = message.channel as TextChannel;

    if (this._whitelistedChannels.has(channel.name)) {
      return;
    }

    this._expressions.forEach((expression) => {
      if (message.content.toLowerCase().match(expression)) {
        this.container.messageService.sendBotReport(message);

        let warningMsg = "";
        const rep = new Moderation.Report(
          message.guild,
          message.author.username,
          warningMsg,
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
