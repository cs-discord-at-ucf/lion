import { IContainer, Mode } from '../common/types';
import { Kernel } from '../bootstrap/kernel';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Listener } from './listener';
import Environment from '../environment';
import { Store } from '../common/store';
import express, { Express } from 'express';

export class Bot {
  private _kernel: Kernel;
  private _listener: Listener;
  private _webServer: Express;
  public container: IContainer;

  constructor() {
    this._kernel = new Kernel();
    this.container = this._kernel.getContainer();
    this._listener = new Listener(this.container);
    this._webServer = express();
    this._load();
  }

  private _load(): void {
    this._registerPlugins();
    this._registerJobs();
    this._registerStores();
    this._registerWebServer();
  }

  private async _registerPlugins(): Promise<void> {
    try {
      const pluginExtension =
        Environment.Playground === Mode.Production ? '.plugin.js' : '.plugin.ts';
      const files = (await fs.readdir(path.join(__dirname, './plugins'))) || [];

      files
        .filter((file) => file.endsWith(pluginExtension))
        .map((plugin) => plugin.replace(pluginExtension, ''))
        .forEach((plugin) => this.container.pluginService.register(plugin, this.container));
    } catch (e) {
      this.container.loggerService.error(e);
    }
  }

  private async _registerJobs() {
    const jobs = this.container.jobService.jobs;
    for (const job of jobs) {
      await this.container.jobService.register(job, this.container);
    }
  }

  private _registerStores() {
    this.container.storeService.stores.forEach((store: Store) => {
      this.container.storeService.register(store);
    });
  }

  private _registerWebServer() {
    this._webServer.listen(Environment.WebserverPort, () =>
      this.container.loggerService.info('Webserver is now running')
    );

    this._webServer.get('/health', (_, res) => res.send('OK'));
  }

  public run(): void {
    //
  }
}
