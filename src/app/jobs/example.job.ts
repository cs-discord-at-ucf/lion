import { Mode } from '../../common/types';
import { Job } from '../../common/job';
import ms from 'ms';

export class ExampleJob extends Job {
  public interval: number = ms('1m');
  public name: string = 'example';

  constructor() {
    super();
  }

  public execute() {
    if (process.env.NODE_ENV === Mode.Production) {
      return;
    }
  }
}
