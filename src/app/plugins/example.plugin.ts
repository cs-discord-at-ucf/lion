import { Plugin } from '../../common/plugin';
import { IContainer, IMessage } from '../../common/types';

export class ExamplePlugin extends Plugin {
  public name: string = 'Test plugin';
  public description: string = 'This is an awesome test plugin.';
  public usage: string = '!test';
  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage): boolean {
    return true;
  }

  public hasPermission(message: IMessage): boolean {
    return true;
  }

  public execute(args?: String): void {
    console.log('Executed', args);
  }
}
