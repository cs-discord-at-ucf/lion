import { Handler } from '../../common/handler';
import { IContainer, IMessage } from '../../common/types';

export class PointMessageHandler extends Handler {
  public name: string = 'PointMessage';
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage): Promise<void> {
    await this.container.pointService.awardPoints(message.author.id, 1);
  }
}
