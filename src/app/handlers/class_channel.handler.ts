import { IContainer, IHandler } from '../../common/types';

export class ClassChannelHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(): Promise<void> {
    await this.container.classService.updateClasses();
  }
}
