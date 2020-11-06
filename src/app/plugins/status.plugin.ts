import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { RichEmbed } from 'discord.js';

export class StatusPlugin extends Plugin {
  public name: string = 'Status';
  public description: string = 'Gets info about Lion';
  public usage: string = 'status';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length == 0;
  }

  public async execute(message: IMessage, args: string[]) {
    console.log('Test!');
  }
}
