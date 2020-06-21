import { MongoClient, Db, Collection, CommandCursor } from 'mongodb';
import { Report } from './report.service';
import Environment from '../environment';

export class StorageService {
  private _db?: Db;
  private _client?: MongoClient;

  private _collections: {
    modreports?: Collection<Report>;
  } = {};

  public constructor() {
    this._connectToDB();
  }

  private async _connectToDB() {
    if (this._db) {
      return this._db;
    }

    const connectionString = this._buildMongoConnectionString();

    try {
      console.log(`Connecting to ${connectionString}`);
      this._client = await MongoClient.connect(connectionString, {
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this._db = this._client.db(Environment.MongoDatabase);

      this._collections.modreports = this._db.collection('modreports');

      console.info(`Successfully connected to ${this._db.databaseName}`);
    } catch (e) {
      console.error(e);
    } finally {
      return this._db;
    }
  }

  public async getCollections() {
    await this._connectToDB();
    return this._collections;
  }

  private _buildMongoConnectionString(): string {
    const e = (s?: string) => encodeURIComponent(s || 'bleh');

    return (
      Environment.MongoURL?.replace('USERNAME', e(Environment.MongoUsername))
        ?.replace('PASSWORD', e(Environment.MongoPassword))
        ?.replace('DATABASE', e(Environment.MongoDatabase)) || 'bad'
    );
  }

  private async disconnectFromMongo() {
    this._client?.close();
  }
}
