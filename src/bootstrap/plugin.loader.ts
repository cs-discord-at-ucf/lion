import { DogPlugin } from '../app/plugins/dog.plugin';
import { UserCountPlugin } from '../app/plugins/users.plugin';
import { GaragePlugin } from '../app/plugins/garage.plugin';
import { WeatherPlugin } from '../app/plugins/weather.plugin';
import { HelpPlugin } from '../app/plugins/help.plugin';
import { RegisterPlugin } from '../app/plugins/register.plugin';
import { UnregisterPlugin } from '../app/plugins/unregister.plugin';
import { ListClassesPlugin } from '../app/plugins/listclasses.plugin';
import { AddRolesPlugin } from '../app/plugins/addroles.plugin';
import { DelRolesPlugin } from '../app/plugins/delroles.plugin';
import { ListRolesPlugin } from '../app/plugins/listroles.plugin';

const PluginStore: { [pluginName: string]: any } = {
  dog: DogPlugin,
  users: UserCountPlugin,
  garage: GaragePlugin,
  weather: WeatherPlugin,
  help: HelpPlugin,
  register: RegisterPlugin,
  unregister: UnregisterPlugin,
  listclasses: ListClassesPlugin,
  addroles: AddRolesPlugin,
  delroles: DelRolesPlugin,
  listroles: ListRolesPlugin,
};

export class PluginLoader {
  constructor(pluginName: string, args?: any) {
    if (!PluginStore[pluginName]) {
      throw new Error(`Plugin ${pluginName} does not exist within the PluginStore.`);
    }
    return new PluginStore[pluginName](args);
  }
}
