import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { Channel } from 'discord.js';

export class ExamplePlugin extends Plugin {
  public name: string = 'Test plugin';
  public description: string = 'This is an awesome test plugin.';
  public usage: string = 'test';
  public permission: ChannelType = ChannelType.Admin;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]): boolean {
    return false;
  }

  public hasPermission(message: IMessage): boolean {
    const channelName = this.container.messageService.getChannel(message).name;

    return this.container.channelService.hasPermission(channelName, this.permission);
  }

  public execute(message: IMessage, args?: String): void {
    console.log('Executed', args);
  }
}
