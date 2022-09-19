import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import ms from 'ms';

export class UnBanJob extends Job {
  public override interval: number = ms('1d');
  public override name: string = 'unban';

  constructor() {
    super();
  }

  public override execute(container: IContainer) {
    container.modService.checkForScheduledUnBans();
  }
}
