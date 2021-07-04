import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import ms from 'ms';

export class UnBanJob extends Job {
  public interval: number = ms('1d');
  public name: string = 'unban';

  constructor() {
    super();
  }

  public execute(container: IContainer) {
    container.modService.checkForScheduledUnBans();
  }
}
