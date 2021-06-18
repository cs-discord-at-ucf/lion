import Constants from '../../common/constants';
import { IMessage } from '../../common/types';
import { PluginTester } from '../common/pluginTester';

export class ExampleTester extends PluginTester {
  public channelName: string = Constants.Channels.Public.BuySellTrade;
  public args: string = '!market list';

  public onResponse(message: IMessage) {
    console.log(message.content);
  }
}
