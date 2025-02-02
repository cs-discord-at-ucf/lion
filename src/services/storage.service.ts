import mongoose, { Connection, Mongoose } from 'mongoose';
import { LoggerService } from './logger.service';

export class StorageService {
  private _db?: Connection['db'];
  private _client?: Mongoose;
  private _connected: Promise<Mongoose>;

  public constructor(private _loggerService: LoggerService) {
    const connectionString = this._buildMongoConnectionString();
    this._connected = mongoose.connect(connectionString);

    this._loggerService.info(`Connecting to ${connectionString}`);
    this._connected
      .then((client) => {
        this._client = client;
        this._db = client.connection.db;
        this._loggerService.info(`Successfully connected to ${this._db?.databaseName}`);
      })
      .catch((reason) => {
        this._loggerService.error(`Failed to connect to mongo: ${reason}`);
      });
  }

  public async connectToDB() {
    return this._connected;
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
