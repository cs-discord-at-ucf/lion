import { IStore } from './types';

export abstract class Store implements IStore {
  public name: string = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public state: any;
}
