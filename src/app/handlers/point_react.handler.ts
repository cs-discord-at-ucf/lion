import { MessageReaction } from 'discord.js';
import { Handler } from '../../common/handler';
import { IContainer } from '../../common/types';

export class PointReactHandler extends Handler {
  public name: string = 'PointReact';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(reaction: MessageReaction): Promise<void> {
    const { message } = reaction;
    const userReacted = reaction.users.cache.last();
    if (!userReacted) {
      return;
    }

    // Make sure the person who reacted was not the bot or the person who posted the message
    if (
      [message.author?.id, this.container.clientService.user?.id].some(
        (id) => id === userReacted.id
      )
    ) {
      return;
    }

    await this.container.pointService.awardPoints(message.author?.id, 1);
  }
}
