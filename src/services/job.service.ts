import { ExampleJob } from '../app/jobs/example.job';
import { Job } from '../common/job';
import { IContainer, IJobEvent } from '../common/types';
import { UnBanJob } from '../app/jobs/unban.job';
import { PoliticsCoCReminder } from '../app/jobs/politicscoc.job';
import { InactiveVoiceJob } from '../app/jobs/inactivevoice.job';
import { PollJob } from '../app/jobs/poll.job';
import { WarningJob } from '../app/jobs/warning.job';
import { WeatherEventsJob } from '../app/jobs/weatherevents.job';

export class JobService {
  public jobs: Job[] = [
    new ExampleJob(),
    new UnBanJob(),
    new PoliticsCoCReminder(),
    new InactiveVoiceJob(),
    new PollJob(),
    new WarningJob(),
    new WeatherEventsJob(),
  ];
  private _runningJobs: { [jobName: string]: NodeJS.Timeout } = {};

  public initJobStates(container: IContainer): Promise<void> {
    return container.controllerService.initRunnableStates(container, Object.values(this.jobs));
  }

  public setJobState(container: IContainer, name: string, state: boolean): Promise<void> {
    const job = this.jobs.filter((j) => j.name.toLowerCase() === name.toLowerCase()).pop();
    if (!job) {
      throw new Error(`Could not find job named \'${name}\'`);
    }

    return container.controllerService.setRunnableState(container, job, state);
  }

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
        if (!job.isActive) {
          return;
        }

        container.loggerService.info(JSON.stringify(jobEvent));
        job.execute(container);
        jobEvent.status = 'fulfillJob';
        container.loggerService.info(JSON.stringify(jobEvent));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        jobEvent.status = 'error';
        jobEvent.error = e.message as string;
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
