import { Mode } from '../../common/types';
import { Job } from '../../common/job';
import ms from 'ms';

export class ExampleJob extends Job {
  public override interval: number = ms('1m');
  public override name: string = 'example';

  constructor() {
    super();
  }

  public override execute() {
    if (process.env.NODE_ENV === Mode.Production) {
      return;
    }
  }
}
