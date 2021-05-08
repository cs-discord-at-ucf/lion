import { CategoryChannel, TextChannel } from 'discord.js';
import moment from 'moment';
import { Job } from '../../common/job';
import { IContainer } from '../../common/types';

export class WarningJob extends Job {
  public interval: number = moment.duration(5, 'minutes').asMilliseconds();
  public name: string = 'Warning Job';

  constructor() {
    super();
  }

  public execute(container: IContainer) {
    //Cache the messages in the warning channels so we can listen
    const warnCat = container.guildService.getChannel('warnings') as CategoryChannel;
    warnCat.children.forEach((chan) => (chan as TextChannel).messages.fetch({ limit: 10 }));
  }
}
