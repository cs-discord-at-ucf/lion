import { Mode } from '../../common/types';
import { Job } from '../../common/job';

export class ExampleJob extends Job {
  public interval: number = 60000;
  public name: string = 'example';

  constructor() {
    super();
  }

  public execute() {
    if (process.env.NODE_ENV === Mode.Production) {return;}
  }
}
