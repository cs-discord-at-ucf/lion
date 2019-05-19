import { IContainer as BottleContainer } from 'bottlejs';
import Bottle from 'bottlejs';
import { Container } from './container';

export class Kernel {
  private _container: BottleContainer;

  constructor() {
    const containerBuilder = new Bottle();
    new Container(containerBuilder);
    containerBuilder.resolve({});
    this._container = containerBuilder.container;
  }

  getContainer(): BottleContainer {
    return this._container;
  }

  boot(): void {
    console.log('Kernel booted');
  }
}
