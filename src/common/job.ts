import ms from 'ms';
import { IJob, IContainer } from './types';

export abstract class Job implements IJob {
  public abstract get name(): string;
  public interval: number = ms('1m');
  public abstract execute(container?: IContainer): void;

  public isActive: boolean = true;
}
