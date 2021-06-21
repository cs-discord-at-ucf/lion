import { IMessage } from '../../common/types';

export abstract class PluginTester {
  public abstract channelName: string;
  public abstract args: string;

  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onResponse(message: IMessage): void {}
}
