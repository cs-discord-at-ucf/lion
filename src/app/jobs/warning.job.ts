import { CategoryChannel, TextChannel } from 'discord.js';
import ms from 'ms';
import { Job } from '../../common/job';
import { IContainer } from '../../common/types';

export class WarningJob extends Job {
  public override interval: number = ms('5m');
  public override name: string = 'Warning Job';

  constructor() {
    super();
  }

  public override execute(container: IContainer) {
    // container;
    // Cache the messages in the warning channels so we can listen
    const warnCat = container.guildService.getChannel('warnings') as CategoryChannel;
    warnCat.children.cache.forEach((chan) => (chan as TextChannel).messages.fetch({ limit: 10 }));
  }
}
