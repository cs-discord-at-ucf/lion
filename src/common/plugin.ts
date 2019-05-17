import { IPlugin } from './types';

export abstract class Plugin implements IPlugin {
  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get usage(): string;

  public abstract validate(): boolean;

  public abstract hasPermission(): boolean;

  public abstract execute(): void;
}
