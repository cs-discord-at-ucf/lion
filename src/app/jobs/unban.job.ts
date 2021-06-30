import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import moment from 'moment';

export class UnBanJob extends Job {
  public interval: number = moment.duration(1, 'day').asMilliseconds();
  public name: string = 'unban';

  constructor() {
    super();
  }

  public execute(container: IContainer) {
    container.modService.checkForScheduledUnBans();
  }
}
