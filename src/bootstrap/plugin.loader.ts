import { EightBallPlugin } from '../app/plugins/8ball.plugin';
import { AddClassChannelsPlugin } from '../app/plugins/addclasschans.plugin';
import { AddRolesPlugin } from '../app/plugins/addroles.plugin';
import { CoronaPlugin } from '../app/plugins/corona.plugin';
import { DeleteClassChannelsPlugin } from '../app/plugins/delclasschans.plugin';
import { DelRolesPlugin } from '../app/plugins/delroles.plugin';
import { DogPlugin } from '../app/plugins/dog.plugin';
import { FetchClassChannelsPlugin } from '../app/plugins/fetchclasschans.plugin';
import { GaragePlugin } from '../app/plugins/garage.plugin';
import { HelpPlugin } from '../app/plugins/help.plugin';
import { ListClassesPlugin } from '../app/plugins/listclasses.plugin';
import { ListRolesPlugin } from '../app/plugins/listroles.plugin';
import { PricePlugin } from '../app/plugins/price.plugin';
import { PubSubPlugin } from '../app/plugins/pubsub.plugin';
import { RegisterPlugin } from '../app/plugins/register.plugin';
import { UnregisterPlugin } from '../app/plugins/unregister.plugin';
import { UserCountPlugin } from '../app/plugins/users.plugin';
import { WeatherPlugin } from '../app/plugins/weather.plugin';

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
  corona: CoronaPlugin,
};

export class PluginLoader {
  constructor(pluginName: string, args?: any) {
    if (!PluginStore[pluginName]) {
      throw new Error(`Plugin ${pluginName} does not exist within the PluginStore.`);
    }
    return new PluginStore[pluginName](args);
  }
}
