import Constants from '../../common/constants';
import { IMessage } from '../../common/types';
import { IPluginTester } from '../common/pluginTester';

export class ExampleTester implements IPluginTester {
  public channelName: string = Constants.Channels.Public.BuySellTrade;
  public args: string = '!market list';

  public onResponse(message: IMessage) {
    console.log(message.content);
  }
}
