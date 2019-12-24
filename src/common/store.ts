import { IStore } from './types';

export abstract class Store implements IStore {
  public name: string = '';
  public state: any;
}
