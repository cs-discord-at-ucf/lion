import { IMessage } from '../../common/types';

export abstract class PluginTester {
  public abstract channelName: string;
  public abstract args: string;

  constructor() {}

  public onResponse(message: IMessage): void {}
}
