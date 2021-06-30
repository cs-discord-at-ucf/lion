import { Mode } from '../../common/types';
import { Job } from '../../common/job';
import moment from 'moment';

export class ExampleJob extends Job {
  public interval: number = moment.duration(1, 'minute').asMilliseconds();
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
