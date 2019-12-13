import { ExampleJob } from '../app/jobs/example.job';
import { Job } from '../common/job';
import { IContainer } from '../common/types';

export class JobService {
  public jobs: Job[] = [new ExampleJob()];
  private _runningJobs: { [jobName: string]: NodeJS.Timeout } = {};

  public async register(job: Job, container: IContainer) {
    if (this._runningJobs[job.name]) {
      throw new Error(`Job ${name} already exists as a running job.`);
    }
    this._runningJobs[job.name] = setInterval(() => job.execute(container), job.interval);
  }

  public size() {
    return Object.keys(this._runningJobs).length;
  }
}
