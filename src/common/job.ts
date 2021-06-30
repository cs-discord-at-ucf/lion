import moment from 'moment';
import { IJob, IContainer } from './types';

export abstract class Job implements IJob {
  public name: string = '';
  public interval: number = moment.duration(1, 'minute').asMilliseconds();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(container?: IContainer) {}
}
