import { Mode } from '../../common/types';
import Environment from '../../environment';
import { Job } from '../../common/job';

export class ExampleJob extends Job {
  public interval: number = 60000;
  public name: string = 'example';

  constructor() {
    super();
  }

  public execute() {
    if (Environment.Playground === Mode.Production) return;
  }
}
