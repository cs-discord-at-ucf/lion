import Bottle from 'bottlejs';
import { ClientService } from '../services/client.service';
import { HttpService } from '../services/http.service';
import { PluginService } from '../services/plugin.service';
import { MessageService } from '../services/message.service';
import { ChannelService } from '../services/channel.service';

export class Container {
  constructor(private _bottle: Bottle) {
    this._bottle.service('clientService', ClientService);
    this._bottle.service('httpService', HttpService);
    this._bottle.service('pluginService', PluginService);
    this._bottle.service('messageService', MessageService);
    this._bottle.service('channelService', ChannelService);
  }
}
