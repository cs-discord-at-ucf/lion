import { Store } from '../../common/store';

export class PubSubStore extends Store {
  public name: string = 'pubSubStore';
  public state: any = {
    onSale: false,
  };
}
