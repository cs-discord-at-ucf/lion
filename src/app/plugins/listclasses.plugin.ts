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

    response += 'CS Classes:\n';
    csClasses.forEach((classObj) => {
      response += `${classObj.name}\n`;
    });

    response += '\nIT Classes:\n';
    itClasses.forEach((classObj) => {
      response += `${classObj.name}\n`;
    });

    response += '\n```\n You can register for classes through the `!register` command.';
    message.reply(response);
  }
}
