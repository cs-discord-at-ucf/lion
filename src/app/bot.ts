import { IContainer, Mode } from '../common/types';
import { Kernel } from '../bootstrap/kernel';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Listener } from './listener';
import Environment from '../environment';
import { Store } from '../common/store';
import express, { Express } from 'express';
import Server from 'http';

export class Bot {
  private _kernel!: Kernel;
  private _listener!: Listener;
  private _webServer!: Express;
  public container!: IContainer;
  private _webServerInstance: Server.Server | undefined;

  constructor() {
    this._initialise();
  }

  private _initialise(): void {
    this._kernel = new Kernel();
    this.container = this._kernel.getContainer();
    this._listener = new Listener(this.container);
    this._webServer = express();
  }

  private _loadAndRun(): void {
    this._registerPlugins();
    this._registerJobs();
    this._registerStores();
    this._registerWebServer();
  }

  private async _registerPlugins(): Promise<void> {
    this.container.pluginService.reset();

    try {
      const pluginExtension =
        Environment.Playground === Mode.Production ? '.plugin.js' : '.plugin.ts';
      const files = (await fs.readdir(path.join(__dirname, './plugins'))) || [];

      files
        .filter((file) => file.endsWith(pluginExtension))
        .map((plugin) => plugin.replace(pluginExtension, ''))
        .forEach((plugin) => this.container.pluginService.register(plugin, this.container));

      const commands = Object.values(this.container.pluginService.plugins).map((plugin, index) => {
        return {
          name: 'teeth',
          description: plugin.description,
        };
      });

      const result = await this.container.clientService.application?.commands.set(commands);
      console.log(result);
    } catch (e) {
      this.container.loggerService.error(e);
    }
  }

  private async _registerJobs() {
    this.container.jobService.reset();

    const jobs = this.container.jobService.jobs;
    for (const job of jobs) {
      await this.container.jobService.register(job, this.container);
    }
  }

  private _registerStores() {
    this.container.storeService.reset();

    this.container.storeService.stores.forEach((store: Store) => {
      this.container.storeService.register(store);
    });
  }

  private _registerWebServer() {
    // reset web server before trying to init again, in case we are retrying
    this._resetWebServer();

    this._webServerInstance = this._webServer.listen(Environment.WebserverPort, () =>
      this.container.loggerService.info('Webserver is now running')
    );

    this._webServer.get('/health', (_, res) => res.send('OK'));
  }

  private _resetWebServer() {
    this._webServerInstance?.close((err) => {
      if (err) {
        this.container.loggerService.error('While closing webServerInstance: ' + err);
      }
    });
  }

  public async run() {
    while (true) {
      try {
        this.container.loggerService.info('Loading and running Bot...');
        this._loadAndRun();

        this.container.loggerService.info('Bot loaded. Sleeping thread until error.');
        // sleep infinitely, waiting for error
        while (true) {
          const waiting = new Promise((resolve) => setTimeout(resolve, 1_000_000_000));
          await waiting;
        }
      } catch (e) {
        console.log('here');
        console.log(e);
        this.container.loggerService.error('Bot crashed with error: ' + e);

        // re-init everything before restarting loop
        this._initialise();
      }
    }
  }
}
