import Bottle from 'bottlejs';
import { ClientService } from '../services/discord.service';

export class Container {
  constructor(private _bottle: Bottle) {
    this._bottle.service('clientService', ClientService);
  }
}
