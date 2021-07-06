import Bottle from 'bottlejs';
import { ClientService } from '../services/client.service';
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
import { RoleService } from '../services/role.service';
import { PollService } from '../services/poll.service';
import { WarningService } from '../services/warning.service';
import { TwitterService } from '../services/twitter.service';
import { GameLeaderboardService } from '../services/gameleaderboard.service';
import { UserService } from '../services/user.service';

export class Container {
  constructor(private _bottle: Bottle) {
    this._bottle.service('clientService', ClientService);
    this._bottle.service('guildService', GuildService, 'clientService');
    this._bottle.service('pluginService', PluginService);
    this._bottle.service('messageService', MessageService, 'guildService');
    this._bottle.service('channelService', ChannelService);
    this._bottle.service('classService', ClassService, 'guildService');
    this._bottle.service('handlerService', HandlerService);
    this._bottle.service('jobService', JobService);
    this._bottle.service('storeService', StoreService);
    this._bottle.service('storageService', StorageService);
    this._bottle.service(
      'modService',
      ModService,
      'clientService',
      'guildService',
      'warningService'
    );
    this._bottle.service('roleService', RoleService);
    this._bottle.service('pollService', PollService, 'clientService');
    this._bottle.service('warningService', WarningService, 'clientService', 'guildService');
    this._bottle.service('twitterService', TwitterService);
    this._bottle.service('gameLeaderboardService', GameLeaderboardService, 'storageService');
    this._bottle.service(
      'gameLeaderboardService',
      GameLeaderboardService,
      'storageService',
      'guildService',
    );
    this._bottle.service('userService', UserService, 'guildService');
  }
}
