import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class ClassChannelHandler extends Handler {
  public name: string = 'ClassChannel';

  constructor(public container: IContainer) {
    super();
  }

  public execute(): void {
    this.container.classService.updateClasses();
  }
}
