import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export class ListClassesPlugin extends Plugin {
  public name: string = 'List Classes Plugin';
  public description: string = 'Returns the current class channels on the server.';
  public usage: string = 'listclasses';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    let filter = args && args.length > 0 ? args[0].toUpperCase() : ClassType.ALL;
    let badFilterParam = false;

    if (filter !== ClassType.ALL) {
      filter = this.container.classService.resolveClassType(filter);
      badFilterParam = !filter;
    }

    const response = this.container.classService.buildClassListText(filter);

    response.push('\n You can register for classes through the `!register` command.');

    if (badFilterParam)
      response.push('\n**The filter supplied is invalid; everything is listed above.**');

    let shouldSendInMain = false;
    for (const r of response) {
      try {
        await message.author.send(r);
      } catch (e) {
        shouldSendInMain = true;
        break;
      }
    }

    if (shouldSendInMain) {
      for (const r of response) {
        try {
          await message.reply(r);
        } catch (e) {}
      }
    }
  }
}
