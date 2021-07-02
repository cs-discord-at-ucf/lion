import { ExampleJob } from '../app/jobs/example.job';
import { Job } from '../common/job';
import { IContainer, IJobEvent } from '../common/types';
import { UnBanJob } from '../app/jobs/unban.job';
import { PoliticsCoCReminder } from '../app/jobs/politicscoc.job';
import { InactiveVoiceJob } from '../app/jobs/inactivevoice.job';
import { PollJob } from '../app/jobs/poll.job';
import { WarningJob } from '../app/jobs/warning.job';

export class JobService {
  public jobs: Job[] = [
    new ExampleJob(),
    new UnBanJob(),
    new PoliticsCoCReminder(),
    new InactiveVoiceJob(),
    new PollJob(),
    new WarningJob(),
  ];
  private _runningJobs: { [jobName: string]: NodeJS.Timeout } = {};

  public register(job: Job, container: IContainer) {
    if (this._runningJobs[job.name]) {
      throw new Error(`Job ${job.name} already exists as a running job.`);
    }
    this._runningJobs[job.name] = setInterval(() => {

      const jobEvent: IJobEvent = {
        status: 'starting',
        jobName: job.name,
        jobType: job.constructor.name,
      };

      try {
        container.loggerService.info(JSON.stringify(jobEvent));
        job.execute(container);
        jobEvent.status = 'fulfillJob';
        container.loggerService.info(JSON.stringify(jobEvent));
      } catch(error) {
        jobEvent.status = 'error';
        jobEvent.error = error;
        container.loggerService.error(JSON.stringify(jobEvent));
      }
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

  public reset() {
    this._runningJobs = {};
  }
}
