import Bottle from 'bottlejs';
import { ClientService } from '../services/client.service';
import { HttpService } from '../services/http.service';
import { PluginService } from '../services/plugin.service';
import { MessageService } from '../services/message.service';
import { ChannelService } from '../services/channel.service';
import { ClassService } from '../services/class.service';
import { GuildService } from '../services/guild.service';
import { HandlerService } from '../services/handler.service';
import { JobService } from '../services/job.service';
import { StoreService } from '../services/store.service';
import { ModService } from '../services/moderation.service';
import { StorageService } from '../services/storage.service';
import { LoggerService } from '../services/logger.service';
import { RoleService } from '../services/role.service';

export class Container {
  constructor(private _bottle: Bottle) {
    this._bottle.service('loggerService', LoggerService);
    this._bottle.service('clientService', ClientService);
    this._bottle.service('guildService', GuildService, 'clientService');
    this._bottle.service('httpService', HttpService);
    this._bottle.service('pluginService', PluginService);
    this._bottle.service('messageService', MessageService, 'guildService');
    this._bottle.service('channelService', ChannelService);
    this._bottle.service('classService', ClassService, 'guildService');
    this._bottle.service('handlerService', HandlerService);
    this._bottle.service('jobService', JobService);
    this._bottle.service('storeService', StoreService);
    this._bottle.service('storageService', StorageService, 'loggerService');
    this._bottle.service(
      'modService',
      ModService,
      'storageService',
      'clientService',
      'guildService',
      'loggerService'
    );
    this._bottle.service('roleService', RoleService);
  }
}
