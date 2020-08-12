import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';

export class ListClassesPlugin extends Plugin {
  public name: string = 'List Classes Plugin';
  public description: string = 'Returns the current class channels on the server.';
  public usage: string = 'listclasses';
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    let response = '```\n';

    let filter = args && args.length > 0 ? args[0].toUpperCase() : ClassType.ALL;
    let badFilterParam = false;

    if (filter !== ClassType.ALL) {
      filter = this.container.classService.resolveClassType(filter);
      badFilterParam = !filter;
    }

    response += this.container.classService.buildClassListText(filter);

    response += '\n```\n You can register for classes through the `!register` command.';

    if (badFilterParam)
      response += '\n**The filter supplied is invalid; everything is listed above.**';

    message.reply(response);
  }
}
