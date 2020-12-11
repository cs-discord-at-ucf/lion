import { IContainer, Mode } from '../common/types';
import { Kernel } from '../bootstrap/kernel';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Listener } from './listener';
import Environment from '../environment';
import { Store } from '../common/store';

export class Bot {
  private _kernel: Kernel;
  private _listener: Listener;
  public container: IContainer;

  constructor() {
    this._kernel = new Kernel();
    this.container = this._kernel.getContainer();
    this._listener = new Listener(this.container);
    this._load();
  }

  private _load(): void {
    this._registerPlugins();
    this._registerJobs();
    this._registerStores();
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

  public run(): void {
    //
  }
}
