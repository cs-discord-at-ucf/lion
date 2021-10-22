import { IHandler } from './types';

export abstract class Handler implements IHandler {
  public abstract get name(): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public abstract execute(...args: any[]): void;

  private _isActive: boolean = true;

  public isActive(): boolean {
    return this._isActive;
  }

  public setActive(state: boolean) {
    this._isActive = state;
  }
}
