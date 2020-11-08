import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class DmReportPlugin extends Plugin {
  public name: string = 'anonreport';
  public description: string = 'anonymously report a concern to moderation team';
  public usage: string = 'simply DM lion, start message with !anonreport and write your concern';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;

  public usableInDM = true;
  public usableInGuild = false;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    this.container.modService.fileAnonReport(message).then(() => {
      message.reply('Thank you, your report has been recorded.');
    });
  }
}
