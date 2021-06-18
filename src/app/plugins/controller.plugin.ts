import { Plugin } from "../../common/plugin";
import { IContainer, ChannelType, IMessage } from "../../common/types";

export class PluginControl extends Plugin {
  public name: string = 'controller';
  public description: string = 'Controls activating and deactivating plugins.';
  public usage: string = "!controller <activate | deactive> <plugin name>";
  public permission: ChannelType = ChannelType.Admin;
  public commandPattern: RegExp = /^(deactivate|activate) (?!\s*$).+/;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return (args && args.length >= 2 && this.commandPattern.test(args.join(' ')));
  }


  public async execute(message: IMessage, args: string[]): Promise<void> {
    const [method, pluginName] = args;

    try {
      this.container.pluginService.setPluginState(pluginName, method === 'activate');
    } catch(e) {
      await message.channel.send(e.message);
      return;
    }

    message.channel.send(`${pluginName} has been ${method}d`);
  }
}