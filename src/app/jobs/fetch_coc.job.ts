import { IContainer, Maybe } from '../../common/types';
import Constants from '../../common/constants';
import { Job } from '../../common/job';
import { TextChannel } from 'discord.js';

export class FetchCoCJob extends Job {
  public interval: number = 1000 * 60 * 60; //Every hour
  public name: string = 'fetch_coc';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    if (!container.guildService.get()) {
      container.loggerService.warn('No guild yet');
      return;
    }

    const conductChan: Maybe<TextChannel> = container.guildService
      .get()
      .channels.find((chan) => chan.name === Constants.Channels.Public.CodeOfConduct) as Maybe<
      TextChannel
    >;

    if (!conductChan) {
      container.loggerService.error('Could not find Code of Conduct Channel');
      return;
    }

    //Cache The CoC message to enable reaction listening
    await conductChan.fetchMessages({ limit: 10 });
  }
}
