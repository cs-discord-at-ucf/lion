import { Plugin } from '../../common/plugin';
import { ClientService } from '../../services/client.service';
import { IContainer } from '../../common/types';

export class SecondPlugin extends Plugin {
  public name: string = 'Second plugin';
  public description: string = 'This is an awesome second plugin.';
  public usage: string = '!second';
  constructor(public container: IContainer) {
    super();
  }

  public validate(): boolean {
    throw new Error('Method not implemented.');
  }

  public hasPermission(): boolean {
    throw new Error('Method not implemented.');
  }

  public execute(args?: string): void {
    throw new Error('Method not implemented.');
  }
}
