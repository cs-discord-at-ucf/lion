import ms from 'ms';
import { IJob, IContainer } from './types';

export abstract class Job implements IJob {
  public name: string = '';
  public interval: number = ms('1m');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(container?: IContainer) {}
}
