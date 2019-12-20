import { IJob, IContainer } from './types';

export abstract class Job implements IJob {
  public name: string = '';
  public interval: number = 60000;
  public execute(container?: IContainer) {}
}
