import { MongoClient, Db, Collection } from 'mongodb';
import { Report } from './report.service';
import Environment from '../environment';

export class StorageService {
  private _db?: Db;
  private _client?: MongoClient;

  private _collections: {
    modreports?: Collection<Report>;
  } = {};

  public constructor() {
    this.connectToDB();
  }

  private async connectToDB() {
    if (this._db) {
      return this._db;
    }

    const connectionString = this._buildMongoConnectionString();

    try {
      this._client = await MongoClient.connect(connectionString, {
        bufferMaxEntries: 0,
        reconnectTries: 2,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this._db = this._client.db(Environment.MongoDatabase);

      this._collections.modreports = this._db.collection('modreports');
    } catch (e) {
      console.error(e);
    } finally {
      return this._db;
    }
  }

  private _buildMongoConnectionString(): string {
    const e = (s?: string) => encodeURIComponent(s || 'bleh');

    return (
      Environment.MongoURL?.replace('USERNAME', e(Environment.MongoDatabase))
        ?.replace('PASSWORD', e(Environment.MongoUsername))
        ?.replace('DATABASE', e(Environment.MongoPassword)) || 'bad'
    );
  }

  private async disconnectFromMongo() {
    this._client?.close();
  }
}
