import { IPlugin, IMessage } from './types';

export abstract class Plugin implements IPlugin {
  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get usage(): string;

  public abstract validate(message: IMessage): boolean;

  public abstract hasPermission(message: IMessage): boolean;

  public abstract execute(): void;
}
