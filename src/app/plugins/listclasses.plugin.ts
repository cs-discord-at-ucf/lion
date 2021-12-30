import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export default class ListClassesPlugin extends Plugin {
  public commandName: string = 'listclasses';
  public name: string = 'List Classes Plugin';
  public description: string = 'Returns the current class channels on the server.';
  public usage: string = 'listclasses';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    if (this.container.classService.getClasses(ClassType.ALL).size === 0) {
      await message.reply('No classes found at this time.');
      return;
    }

    const filterName = args.length ? args[0].toUpperCase() : ClassType.ALL;

    const filter = this.container.classService.resolveClassType(filterName);
    const response = this.container.classService.buildClassListText(filterName);
    response.push('\n You can register for classes through the `!register` command.');

    if (!filter) {
      response.push('\n**The filter supplied is invalid; everything is listed above.**');
    }

    for (const r of response) {
      await this.container.messageService.attemptDMUser(message, r);
    }
  }
}
