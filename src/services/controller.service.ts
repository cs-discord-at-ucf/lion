import { IContainer, IRunnable } from '../common/types';
import mongoose from 'mongoose';
import { RunnableStateModel } from '../schemas/state.schema';

export class ControllerService {
  constructor() {}

  public async initRunnableStates(container: IContainer, runnables: IRunnable[]): Promise<void> {
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

    const fetchedStates = await RunnableStateModel.find({
      guildID: container.guildService.get().id,
    });

    runnables.forEach((runnable) => {
      fetchedStates.forEach((state) => {
        if (state.name === runnable.name) {
          runnable.isActive = state.isActive;
        }
      });
    });
  }

  public async setRunnableState(container: IContainer, runnable: IRunnable, state: boolean) {
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
