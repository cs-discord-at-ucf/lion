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

    let listCsClasses = !args || args.length == 0 || args[0].toLowerCase() == 'cs';
    let listItClasses = !args || args.length == 0 || args[0].toLowerCase() == 'it';

    const listingSomething = listCsClasses || listItClasses;

    // if we aren't listing anything due to bad args, we list everything.
    listCsClasses = listCsClasses || !listingSomething;
    listItClasses = listItClasses || !listingSomething;

    if (listCsClasses) {
      response += 'CS Classes:\n';

      const csClassNames: string[] = [];
      for (const classObj of csClasses) {
        csClassNames.push(classObj[1].name);
      }

      csClassNames.sort().forEach((classObjname) => {
        response += `${classObjname}\n`;
      });
    }

    if (listItClasses) {
      const itClassNames: string[] = [];
      for (const classObj of itClasses) {
        itClassNames.push(classObj[1].name);
      }

      response += `${listCsClasses ? '\n' : ''}IT Classes:\n`;
      itClassNames.sort().forEach((classObjname) => {
        response += `${classObjname}\n`;
      });
    }

    response += '\n```\n You can register for classes through the `!register` command.';

    if (!listingSomething)
      response += '\n**The filter supplied is invalid; everything is listed above.**';

    message.reply(response);
  }
}
