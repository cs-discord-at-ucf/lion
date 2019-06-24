import { IContainer } from '../common/types';
import { Kernel } from '../bootstrap/kernel';
import * as fs from 'fs';
import * as path from 'path';
import { Listener } from './listener';

export class Bot {
  private _kernel: Kernel;
  private _listener: any;
  public container: IContainer;

  constructor() {
    this._kernel = new Kernel();
    this.container = this._kernel.getContainer();
    this._listener = new Listener(this.container);
    this._load();
  }

  private _load(): void {
    this._registerPlugins();
  }

  private _registerPlugins(): void {
    fs.readdir(path.join(__dirname, './plugins'), (err, plugins) => {
      if (err) {
        return console.error(err);
      }
      plugins.forEach((plugin) => {
        const pluginName = plugin.replace('.plugin.ts', '');
        this.container.pluginService.register(pluginName, this.container);
      });
    });
  }

  public run(): void {
    //
  }
}
