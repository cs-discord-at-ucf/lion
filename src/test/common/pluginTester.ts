import { IMessage } from '../../common/types';

export interface IPluginTester {
  channelName: string;
  args: string;

  onResponse?: (message: IMessage) => void;
}
