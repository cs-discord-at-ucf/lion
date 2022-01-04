import { MessageReaction } from 'discord.js';
import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class PointReactHandler extends Handler {
  public name: string = 'PointReact';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(reaction: MessageReaction): Promise<void> {
    const message = reaction.message;
    await this.container.pointService.awardPoints(message.author?.id, 1);
  }
}
