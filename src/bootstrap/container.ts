import Bottle from 'bottlejs';
import { ChannelService } from '../services/channel.service';
import { ClassService } from '../services/class.service';
import { ClientService } from '../services/client.service';
import { ControllerService } from '../services/controller.service';
import { GameLeaderboardService } from '../services/gameleaderboard.service';
import { GuildService } from '../services/guild.service';
import { HandlerService } from '../services/handler.service';
import { HttpService } from '../services/http.service';
import { JobService } from '../services/job.service';
import { LoggerService } from '../services/logger.service';
import { MessageService } from '../services/message.service';
import { ModService } from '../services/moderation.service';
import { PluginService } from '../services/plugin.service';
import { PointService } from '../services/point.service';
import { RoleService } from '../services/role.service';
import { StorageService } from '../services/storage.service';
import { StoreService } from '../services/store.service';
import { UserService } from '../services/user.service';
import { WarningService } from '../services/warning.service';

export class Container {
  constructor(private _bottle: Bottle) {
    this._bottle.service('loggerService', LoggerService);
    this._bottle.service('clientService', ClientService);
    this._bottle.service('guildService', GuildService, 'clientService');
    this._bottle.service('httpService', HttpService);
    this._bottle.service('pluginService', PluginService);
    this._bottle.service('messageService', MessageService, 'guildService', 'loggerService');
    this._bottle.service('channelService', ChannelService);
    this._bottle.service(
      'classService',
      ClassService,
      'guildService',
      'loggerService',
      'messageService'
    );
    this._bottle.service('handlerService', HandlerService);
    this._bottle.service('jobService', JobService);
    this._bottle.service('storeService', StoreService);
    this._bottle.service('storageService', StorageService, 'loggerService');
    this._bottle.service(
      'modService',
      ModService,
      'clientService',
      'guildService',
      'loggerService',
      'warningService'
    );
    this._bottle.service('roleService', RoleService);
    this._bottle.service('warningService', WarningService, 'clientService', 'guildService');
    this._bottle.service('gameLeaderboardService', GameLeaderboardService, 'storageService');
    this._bottle.service(
      'gameLeaderboardService',
      GameLeaderboardService,
      'storageService',
      'guildService',
      'loggerService'
    );
    this._bottle.service('userService', UserService, 'guildService');
    this._bottle.service('controllerService', ControllerService, 'loggerService', 'storageService');
    this._bottle.service('pointService', PointService, 'guildService', 'userService');
  }
}
