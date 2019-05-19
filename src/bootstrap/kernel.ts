import { IContainer as BottleContainer } from 'bottlejs';
import Bottle from 'bottlejs';
import { Container } from './container';
import { IContainer } from '../common/types';

export class Kernel {
  private _container: BottleContainer;

  constructor() {
    const containerBuilder = new Bottle();
    new Container(containerBuilder);
    containerBuilder.resolve({});
    this._container = containerBuilder.container;
  }

  getContainer(): IContainer {
    return this._container as IContainer;
  }

  boot(): void {
    console.log('Kernel booted');
  }
}
