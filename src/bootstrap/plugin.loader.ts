/* eslint-disable @typescript-eslint/no-explicit-any */
import { DogPlugin } from '../app/plugins/dog.plugin';
import { UserCountPlugin } from '../app/plugins/users.plugin';
import { GaragePlugin } from '../app/plugins/garage.plugin';
import { EightBallPlugin } from '../app/plugins/8ball.plugin';
import { WeatherPlugin } from '../app/plugins/weather.plugin';
import { HelpPlugin } from '../app/plugins/help.plugin';
import { RegisterPlugin } from '../app/plugins/register.plugin';
import { UnregisterPlugin } from '../app/plugins/unregister.plugin';
import { ListClassesPlugin } from '../app/plugins/listclasses.plugin';
import { AddRolesPlugin } from '../app/plugins/addroles.plugin';
import { DelRolesPlugin } from '../app/plugins/delroles.plugin';
import { ListRolesPlugin } from '../app/plugins/listroles.plugin';
import { PricePlugin } from '../app/plugins/price.plugin';
import { DeleteClassChannelsPlugin } from '../app/plugins/delclasschans.plugin';
import { PubSubPlugin } from '../app/plugins/pubsub.plugin';
import { FetchClassChannelsPlugin } from '../app/plugins/fetchclasschans.plugin';
import { AddClassChannelsPlugin } from '../app/plugins/addclasschans.plugin';
import { CatPlugin } from '../app/plugins/cat.plugin';
import { CodePlugin } from '../app/plugins/code.plugin';
import { ModReportPlugin } from '../app/plugins/modreport.plugin';
import { ChanBanPlugin } from '../app/plugins/chanban.plugin';
import { SlowModePlugin } from '../app/plugins/slowmode.plugin';
import { ScoresPlugin } from '../app/plugins/scores.plugin';
import { MarketPlacePlugin } from '../app/plugins/marketplace.plugin';
import { ManageRolesPlugin } from '../app/plugins/manageroles.plugin';
import { StatusPlugin } from '../app/plugins/status.plugin';
import { DmReportPlugin } from '../app/plugins/anonreport.plugin';
import { TaPlugin } from '../app/plugins/ta.plugin';
import { ShadowBanPlugin } from '../app/plugins/shadowban.plugin';
import { CheckClassesPlugin } from '../app/plugins/checkclasses.plugin';
import { BroadcastPlugin } from '../app/plugins/broadcast.plugin';
import { CreateClassVoice } from '../app/plugins/createclassvoice.plugin';
import { PollPlugin } from '../app/plugins/poll.plugin';
import { BubbleWrapPlugin } from '../app/plugins/bubblewrap.plugin';
import { CrumblPlugin } from '../app/plugins/crumbl.plugin';
import { DiceRollPlugin } from '../app/plugins/diceroll.plugin';

const PluginStore: { [pluginName: string]: any } = {
  dog: DogPlugin,
  users: UserCountPlugin,
  garage: GaragePlugin,
  '8ball': EightBallPlugin,
  weather: WeatherPlugin,
  help: HelpPlugin,
  register: RegisterPlugin,
  unregister: UnregisterPlugin,
  listclasses: ListClassesPlugin,
  addroles: AddRolesPlugin,
  delroles: DelRolesPlugin,
  listroles: ListRolesPlugin,
  price: PricePlugin,
  delclasschans: DeleteClassChannelsPlugin,
  fetchclasschans: FetchClassChannelsPlugin,
  addclasschans: AddClassChannelsPlugin,
  pubsub: PubSubPlugin,
  cat: CatPlugin,
  code: CodePlugin,
  modreport: ModReportPlugin,
  chanban: ChanBanPlugin,
  slowmode: SlowModePlugin,
  scores: ScoresPlugin,
  marketplace: MarketPlacePlugin,
  manageroles: ManageRolesPlugin,
  status: StatusPlugin,
  anonreport: DmReportPlugin,
  ta: TaPlugin,
  shadowban: ShadowBanPlugin,
  checkclasses: CheckClassesPlugin,
  broadcast: BroadcastPlugin,
  createclassvoice: CreateClassVoice,
  poll: PollPlugin,
  bubblewrap: BubbleWrapPlugin,
  crumbl: CrumblPlugin,
  diceroll: DiceRollPlugin,
};

export class PluginLoader {
  constructor(pluginName: string, args?: any) {
    if (!PluginStore[pluginName]) {
      throw new Error(`Plugin ${pluginName} does not exist within the PluginStore.`);
    }
    return new PluginStore[pluginName](args);
  }
}

export const PLUGIN_STORE_SIZE = Object.keys(PluginStore).length;
