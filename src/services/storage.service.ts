import { LoggerService } from './logger.service';
import mongoose, { Connection } from 'mongoose';

export class StorageService {
  private _db?: Connection['db'];
  private _client?: typeof mongoose;

  public constructor(private _loggerService: LoggerService) {
    this.connectToDB();
  }

  public async connectToDB() {
    if (this._db) {
      return this._db;
    }

    const connectionString = this._buildMongoConnectionString();

    try {
      this._loggerService.debug(`Connecting to ${connectionString}`);
      this._client = await mongoose.connect(connectionString, {
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this._db = this._client.connection.db;

      console.info(`Successfully connected to ${this._db.databaseName}`);
    } catch (e) {
      this._loggerService.error(e);
    } finally {
      return this._db;
    }
  }

  private _buildMongoConnectionString(): string {
    const e = (s?: string) => encodeURIComponent(s ?? '');
    const { MONGO_URL, MONGO_USER_PASS, MONGO_USER_NAME, MONGO_DB_NAME } = process.env;
    return (
      MONGO_URL?.replace('USERNAME', e(MONGO_USER_NAME))
        ?.replace('PASSWORD', e(MONGO_USER_PASS))
        ?.replace('DATABASE', e(MONGO_DB_NAME)) ?? ''
    );
  }

  private async _disconnectFromMongo() {
    await this._client?.connection.close();
  }
}
