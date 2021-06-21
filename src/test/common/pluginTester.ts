import { IMessage } from '../../common/types';

export interface IPluginTester {
  channelName: string;
  args: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResponse?: (message: IMessage) => void;
}
