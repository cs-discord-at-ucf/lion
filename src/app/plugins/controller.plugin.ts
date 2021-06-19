import { Plugin } from '../../common/plugin';
import { IContainer, ChannelType, IMessage } from '../../common/types';

export class PluginControl extends Plugin {
  public name: string = 'controller';
  public description: string = 'Controls activating and deactivating plugins.';
  public usage: string = '!controller <activate | deactive> <plugin name>';
  public permission: ChannelType = ChannelType.Admin;
  public commandPattern: RegExp = /^(deactivate|activate) (?!\s*$).+/;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return this.commandPattern.test(args.join(' '));
  }


  public async execute(message: IMessage, args: string[]): Promise<void> {
    const [method, pluginName] = args;

    let plugin;
    try {
      plugin = this.container.pluginService.setPluginState(pluginName, method === 'activate');
    } catch(e) {
      await message.channel.send(e.message);
      return;
    }

    // Save data in persistently.
    const pluginStateData = (await this.container.storageService.getCollections()).pluginState;
    if (!pluginStateData) {
      message.channel.send('Error connecting to the DB');
      return;
    }

    try {
      await pluginStateData
        .updateOne({ name:  plugin.name }, 
          { $set: { isActive: method === 'activate' }},
          { upsert: true });
    } catch(error) {
      console.log(error);
      return;
    }
    
  
  
    message.channel.send(`${pluginName} has been ${method}d`);
  }
}