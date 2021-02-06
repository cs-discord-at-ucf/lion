import { Store } from '../common/store';
import { PubSubStore } from '../app/stores/pub_sub.store';

export class StoreService {
  public stores: Store[] = [new PubSubStore()];
  private _stores: { [storeName: string]: Store } = {};

  public register(store: Store) {
    if (this._stores[store.name]) {
      throw new Error(`Store ${store.name} already exists as a store.`);
    }
    this._stores[store.name] = store;
  }

  public get(storeName: string): Store {
    if (!this._stores[storeName]) {
      throw new Error(`Unable to locate ${storeName}`);
    }
    return this._stores[storeName];
  }

  public reset() {
    this._stores = {};
  }
}
