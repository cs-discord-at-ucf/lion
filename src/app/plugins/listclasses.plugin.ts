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
    const csClasses = this.container.classService.getClasses(ClassType.CS);
    const itClasses = this.container.classService.getClasses(ClassType.IT);
    let response = '```\n';

    let filter = args && args.length > 0 ? args[0].toUpperCase() : ClassType.ALL;
    let badFilterParam = false;

    if (filter != ClassType.CS && filter != ClassType.IT && filter != ClassType.ALL) {
      filter = 'ALL';
      badFilterParam = true;
    }

    const listCsClasses = filter == 'CS' || filter == 'ALL';
    const listItClasses = filter == 'IT' || filter == 'ALL';

    if (listCsClasses) {
      const csClassNames = Array.from(csClasses, ([key, value]) => value.name).sort();

      response += 'CS Classes:\n';
      response += csClassNames.join('\n');
      response += '\n';
    }

    if (listItClasses) {
      const itClassNames = Array.from(itClasses, ([key, value]) => value.name).sort();

      response += `${listCsClasses ? '\n' : ''}IT Classes:\n`;
      response += itClassNames.join('\n');
      response += '\n';
    }

    response += '\n```\n You can register for classes through the `!register` command.';

    if (badFilterParam)
      response += '\n**The filter supplied is invalid; everything is listed above.**';

    message.reply(response);
  }
}
