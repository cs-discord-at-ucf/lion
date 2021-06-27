import { MongoClient, Db, Collection } from 'mongodb';
import { Moderation } from './moderation.service';
import { LoggerService } from './logger.service';
import { ITAEntry } from '../app/plugins/ta.plugin';
import { IGameLeaderBoardEntry } from './gameleaderboard.service';
import { IServerInfo } from '../common/types';
import { IClassPin } from '../app/plugins/storepins.plugin';
import { IPluginState } from './plugin.service';

export class StorageService {
  private _db?: Db;
  private _client?: MongoClient;

  private _collections: {
    modreports?: Collection<Moderation.IModerationReport>;
    modbans?: Collection<Moderation.IModerationBan>;
    modwarnings?: Collection<Moderation.IModerationWarning>;
    classTAs?: Collection<ITAEntry>;
    tttLeaderboard?: Collection<IGameLeaderBoardEntry>;
    connectFourLeaderboard?: Collection<IGameLeaderBoardEntry>;
    serverInfo?: Collection<IServerInfo>;
    pins?: Collection<IClassPin>;
    pluginState?: Collection<IPluginState>;
  } = {};

  public constructor(private _loggerService: LoggerService) {
    this._connectToDB();
  }

  private async _connectToDB() {
    if (this._db) {
      return this._db;
    }

    const connectionString = this._buildMongoConnectionString();

    try {
      this._loggerService.debug(`Connecting to ${connectionString}`);
      this._client = await MongoClient.connect(connectionString, {
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this._db = this._client.db(process.env.MONGO_DB_NAME);

      this._collections.modreports = this._db.collection('modreports');
      this._collections.modbans = this._db.collection('modbans');
      this._collections.modwarnings = this._db.collection('modwarnings');
      this._collections.classTAs = this._db.collection('classTAs');
      this._collections.tttLeaderboard = this._db.collection('tttLeaderboard');
      this._collections.connectFourLeaderboard = this._db.collection('connectFourLeaderboard');
      this._collections.serverInfo = this._db.collection('serverInfo');
      this._collections.pins = this._db.collection('pins');
      this._collections.pluginState = this._db.collection('pluginState');

      console.info(`Successfully connected to ${this._db.databaseName}`);
    } catch (e) {
      this._loggerService.error(e);
    } finally {
      return this._db;
    }
  }

  public async getCollections() {
    await this._connectToDB();
    return this._collections;
  }

  private _buildMongoConnectionString(): string {
    const e = (s?: string) => encodeURIComponent(s || '');
    const { MONGO_URL, MONGO_USER_PASS, MONGO_USER_NAME, MONGO_DB_NAME } = process.env;
    return (
      MONGO_URL?.replace('USERNAME', e(MONGO_USER_NAME))
        ?.replace('PASSWORD', e(MONGO_USER_PASS))
        ?.replace('DATABASE', e(MONGO_DB_NAME)) ?? ''
    );
  }

  private async _disconnectFromMongo() {
    this._client?.close();
  }
}
