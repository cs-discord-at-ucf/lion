import { Plugin } from '../common/plugin';
import { IContainer, IMessage, ChannelType } from '../common/types';

export class DmPlugin extends Plugin {
  public name: string = 'dm';
  public description: string = '';
  public usage: string = '';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;

  public usableInDM = true;
  public usableInGuild = false;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    message.reply('hi');
  }
}
