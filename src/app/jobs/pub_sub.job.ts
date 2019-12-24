import { IContainer } from '../../common/types';
import { Job } from '../../common/job';

export class PubSubJob extends Job {
  public interval: number = 1000 * 60 * 60; // every 60 minutes
  public name: string = 'pubSubJob';
  private _pubSubStoreState: any = undefined;
  private _endpoint: string = 'http://arepublixchickentendersubsonsale.com/';
  private _needle: string = '<!-- onsale:yes -->';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    if (!this._pubSubStoreState) {
      this._pubSubStoreState = container.storeService.get('pubSubStore').state;
    }

    try {
      const response = await container.httpService.get(this._endpoint);
      if (response.data.includes(this._needle)) {
        // TODO: Include some sort of other event that announces to the server that lets people know (?)
        this._pubSubStoreState.onSale = true;
      } else {
        this._pubSubStoreState.onSale = false;
      }
    } catch (_e) {
      this._pubSubStoreState.onSale = false;
    }
  }
}
