import { IContainer } from '../../common/types';
import { Job } from '../../common/job';

export class UnBanJob extends Job {
  public interval: number = 1000 * 60 * 60 * 24; // runs each day..
  public name: string = 'unban';

  constructor() {
    super();
  }

  public execute(container: IContainer) {
    container.modService.checkForScheduledUnBans();
  }
}
