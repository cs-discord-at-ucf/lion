import { IContainer, IRunnable } from '../common/types';
import mongoose from 'mongoose';
import { RunnableStateModel } from '../schemas/state.schema';
import { LoggerService } from './logger.service';
import { StorageService } from './storage.service';

export class ControllerService {
  constructor(private _loggerService: LoggerService, private _storageService: StorageService) {}

  public async initRunnableStates(container: IContainer, runnables: IRunnable[]): Promise<void> {
    if (
      !process.env.MONGO_DB_NAME ||
      !process.env.MONGO_URL ||
      !process.env.MONGO_USER_NAME ||
      !process.env.MONGO_USER_PASS
    ) {
      return;
    }

    try {
      await this._storageService.connectToDB();
    } catch (e) {
      return;
    }

    const fetchedStates = await (async () => {
      let tries = 0;
      while (mongoose.connection.readyState !== 1 && tries < 6) {
        const waiting = new Promise((resolve) => setTimeout(resolve, 10));
        await waiting;
        tries += 1;
      }

      if (mongoose.connection.readyState !== 1) {
        this._loggerService.error(
          `Could not connect to DB so won\'t load runnablestatemodels waited ${
            tries * 10
          } secs (${tries} tries)`
        );

        return [];
      }

      return await RunnableStateModel.find({
        guildID: container.guildService.get().id,
      });
    })();

    runnables.forEach((runnable) => {
      fetchedStates.forEach((state) => {
        if (state.name === runnable.name) {
          runnable.isActive = state.isActive;
        }
      });
    });
  }

  public async setRunnableState(
    container: IContainer,
    runnable: IRunnable | IRunnable[],
    state: boolean
  ) {
    // If an array was given, switch states on them all
    if (Array.isArray(runnable)) {
      await Promise.all(runnable.map((r) => this.setRunnableState(container, r, state)));
      return;
    }

    if (runnable.isActive === state) {
      throw new Error(`This plugin is already ${state ? 'activated' : 'deactivated'}`);
    }

    runnable.isActive = state;

    // Save data in persistently.
    if (!mongoose.connection.readyState) {
      throw new Error('Error connecting to the DB');
    }

    try {
      await RunnableStateModel.updateOne(
        { name: runnable.name, guildID: container.guildService.get().id },
        { $set: { isActive: state } },
        { upsert: true }
      );
    } catch (error) {
      console.log(error);
    }
  }
}
