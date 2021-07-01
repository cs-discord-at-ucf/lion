import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import Constants from '../../common/constants';
import { TextChannel } from 'discord.js';
import ms from 'ms';

export class PoliticsCoCReminder extends Job {
  public interval: number = ms('30m');
  public name: string = 'politics_coc_reminder';

  constructor() {
    super();
  }

  public execute(container: IContainer) {
    try {
      container.loggerService.debug(`Starting ${this.name} job`);

      if (!container.guildService.get()) {
        container.loggerService.warn('No guild yet');
        return;
      }

      // console.log(container.guildService.get().channels);

      const politicsChan = container.guildService
        .get()
        .channels.cache.find((c) => c.name === Constants.Channels.Public.Politics);

      if (!politicsChan) {
        container.loggerService.silly("no politics channel detected (it's for the best)");
        return;
      }

      const codeOfConduct = container.guildService
        .get()
        .channels.cache.find((c) => c.name === Constants.Channels.Info.CodeOfConduct);

      if (!codeOfConduct) {
        container.loggerService.silly('no code of conduct channel detected');
        return;
      }

      (politicsChan as TextChannel).send(
        `Please remember to follow the <#${codeOfConduct.id}>, especially in this channel!`
      );
    } catch (ex) {
      container.loggerService.error(ex);
      console.log(ex);
    }
  }
}
