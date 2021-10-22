import { IHandler } from './types';

export abstract class Handler implements IHandler {
  public abstract get name(): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public abstract execute(...args: any[]): void;

  public isActive: boolean = true;
}
