import { ExamplePlugin } from '../app/plugins/example.plugin';
import { DogPlugin } from '../app/plugins/dog.plugin';
import { UserCountPlugin } from '../app/plugins/users.plugin';
import { GaragePlugin } from '../app/plugins/garage.plugin';

const PluginStore: { [pluginName: string]: any } = {
  example: ExamplePlugin,
  dog: DogPlugin,
  users: UserCountPlugin,
  garage: GaragePlugin
};

export class PluginLoader {
  constructor(pluginName: string, args?: any) {
    if (!PluginStore[pluginName]) {
      throw new Error(`Plugin ${pluginName} does not exist within the PluginStore.`);
    }
    return new PluginStore[pluginName](args);
  }
}
