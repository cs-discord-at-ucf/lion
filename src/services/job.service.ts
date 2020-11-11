import { ExampleJob } from '../app/jobs/example.job';
import { Job } from '../common/job';
import { IContainer } from '../common/types';
import { PubSubJob } from '../app/jobs/pub_sub.job';
import { UnBanJob } from '../app/jobs/unban.job';
import { PoliticsCoCReminder } from '../app/jobs/politicscoc.job';

export class JobService {
  public jobs: Job[] = [
    new ExampleJob(),
    new PubSubJob(),
    new UnBanJob(),
    new PoliticsCoCReminder(),
  ];
  private _runningJobs: { [jobName: string]: NodeJS.Timeout } = {};

  public async register(job: Job, container: IContainer) {
    if (this._runningJobs[job.name]) {
      throw new Error(`Job ${job.name} already exists as a running job.`);
    }
    this._runningJobs[job.name] = setInterval(async () => {
      return job.execute(container);
    }, job.interval);
  }

  public kill(jobName: string) {
    if (!this._runningJobs[jobName]) {
      throw new Error(`Unable to locate ${jobName}`);
    }
    clearInterval(this._runningJobs[jobName]);
    delete this._runningJobs[jobName];
  }

  public size() {
    return Object.keys(this._runningJobs).length;
  }
}
