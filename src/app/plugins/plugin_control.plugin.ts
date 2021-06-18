import { Plugin } from "../../common/plugin";
import { IContainer, ChannelType, IMessage } from "../../common/types";

export class PluginControl extends Plugin {
  public name: string = 'controller';
  public description: string = 'Controls activating and deactivating plugins.';
  public usage: string = "!controller <activate | deactive> <plugin name>";
  public permission: ChannelType = ChannelType.Admin;

  constructor(public container: IContainer) {
    super();
  }


  public async execute(message: IMessage, args?: string[]): Promise<void> {
    if (!args || args!.length < 2) {
      await message.channel.send(`Usage: ${this.usage}`);
      return;
    }

    const [method, pluginName] = args;

    switch (method) {
      case 'deactivate':
        this.container.pluginService.setPluginActive(pluginName, false);
        break;
      case 'activate':
        this.container.pluginService.setPluginActive(pluginName, true);
        break;
      default:
        await message.channel.send(`${method} is invalid, possible options are activate or deactivate.`)
    }
  }
    
}