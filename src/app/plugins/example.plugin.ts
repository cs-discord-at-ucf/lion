import { Plugin } from '../../common/plugin';

export class ExamplePlugin extends Plugin {
  public name: string = 'Test plugin';
  public description: string = 'This is an awesome test plugin.';
  public usage: string = '!test';

  public validate(): boolean {
    throw new Error('Method not implemented.');
  }

  public hasPermission(): boolean {
    throw new Error('Method not implemented.');
  }

  public execute(): void {
    throw new Error('Method not implemented.');
  }
}
