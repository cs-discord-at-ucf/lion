import { IPlugin, IMessage, ChannelType, IContainer } from './types';

export abstract class Plugin implements IPlugin {
  public abstract container: IContainer;

  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get usage(): string;

  public abstract get permission(): ChannelType;

  public validate(message: IMessage, args: string[]) {
    return true;
  }

  public hasPermission(message: IMessage): boolean {
    const channelName = this.container.messageService.getChannel(message).name;
    const response = this.container.channelService.hasPermission(channelName, this.permission);
    if (!response) {
      message.reply(`Please use this command in the \`${this.permission}\` channel`);
    }
    return response;
  }

  public abstract async execute(message: IMessage, args?: string[]): Promise<void>;
}
