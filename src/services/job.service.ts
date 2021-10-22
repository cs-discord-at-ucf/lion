import { ExampleJob } from '../app/jobs/example.job';
import { Job } from '../common/job';
import { IContainer, IJobEvent } from '../common/types';
import { UnBanJob } from '../app/jobs/unban.job';
import { PoliticsCoCReminder } from '../app/jobs/politicscoc.job';
import { InactiveVoiceJob } from '../app/jobs/inactivevoice.job';
import { PollJob } from '../app/jobs/poll.job';
import { WarningJob } from '../app/jobs/warning.job';
import { WeatherEventsJob } from '../app/jobs/weatherevents.job';
import mongoose from 'mongoose';
import { JobStateModel } from '../schemas/state.schema';

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

  public async initJobStates(container: IContainer) {
    if (
      !process.env.MONGO_DB_NAME ||
      !process.env.MONGO_URL ||
      !process.env.MONGO_USER_NAME ||
      !process.env.MONGO_USER_PASS
    ) {
      return;
    }

    if (!mongoose.connection.readyState) {
      await container.storageService.connectToDB();
    }

    const fetchedStates = await JobStateModel.find({
      guildID: container.guildService.get().id,
    });

    // Set all of the plugins to the persisted state.
    Object.values(this.jobs).forEach((job) => {
      fetchedStates.forEach((state) => {
        if (state.name === job.name) {
          job.setActive(state.isActive);
        }
      });
    });
  }

  public async setJobState(container: IContainer, name: string, state: boolean): Promise<void> {
    const job = this.jobs.filter((j) => j.name.toLowerCase() === name.toLowerCase()).pop();
    if (!job) {
      throw new Error(`Could not find job named \'${name}\'`);
    }

    if (job.isActive() === state) {
      throw new Error(`This job is already ${state ? 'activated' : 'deactivated'}`);
    }

    job.setActive(state);

    // Save data in persistently.
    if (!mongoose.connection.readyState) {
      throw new Error('Error connecting to the DB');
    }

    try {
      await JobStateModel.updateOne(
        { name: job.name, guildID: container.guildService.get().id },
        { $set: { isActive: state } },
        { upsert: true }
      );
    } catch (error) {
      console.log(error);
    }
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
        if (!job.isActive()) {
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
