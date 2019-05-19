import { ExamplePlugin } from './plugins/example.plugin';
import { IContainer } from '../common/types';
import { Kernel } from '../common/kernel';

export class Bot {
  private _kernel: Kernel;
  public container: IContainer;
  constructor() {
    this._kernel = new Kernel();
    this.container = this._kernel.getContainer() as IContainer;
  }

  public run(): void {
    const plugin = new ExamplePlugin(this.container);
  }
}
