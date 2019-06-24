import { ExamplePlugin } from '../app/plugins/example.plugin';
import { DogPlugin } from '../app/plugins/dog.plugin';

const PluginStore: { [pluginName: string]: any } = {
  example: ExamplePlugin,
  dog: DogPlugin,
};

export class PluginLoader {
  constructor(pluginName: string, args?: any) {
    if (!PluginStore[pluginName]) {
      throw new Error(`Plugin ${pluginName} does not exist within the PluginStore.`);
    }
    return new PluginStore[pluginName](args);
  }
}
