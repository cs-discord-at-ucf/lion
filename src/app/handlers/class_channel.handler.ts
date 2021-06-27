import { IContainer, IHandler } from '../../common/types';

export class ClassChannelHandler implements IHandler {
  constructor(public container: IContainer) {}

  public execute(): void {
    this.container.classService.updateClasses();
  }
}
