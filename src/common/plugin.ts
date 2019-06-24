import { IPlugin, IMessage, ChannelType } from './types';

export abstract class Plugin implements IPlugin {
  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get usage(): string;

  public abstract get permission(): ChannelType;

  public abstract validate(message: IMessage, args: string[]): boolean;

  public abstract hasPermission(message: IMessage): boolean;

  public abstract execute(message: IMessage): void;
}
