import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';
import Constants from '../../common/constants';

export class CheckClassesPlugin extends Plugin {
  public name: string = 'Check Class';
  public description: string = 'lists the classes someone is in';
  public usage: string = 'checkclasses <user>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.UserOffenses;

  private _MAX_CHAR_LIMIT: number = 2000;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length >= 1;
  }

  public async execute(message: IMessage, args: string[]) {
    const targetUserName = args.join(' ');

    const member = this.container.guildService
      .get()
      .members.cache.filter((m) => m.user.tag === targetUserName)
      .first();
    if (!member) {
      message.reply('User not found.');
      return;
    }

    const classes = this.container.classService.getClasses(ClassType.ALL);
    const chansContainingUser = Array.from(classes.values()).filter((chan) =>
      Boolean(chan.permissionOverwrites.get(member.id)?.allow)
    );

    if (chansContainingUser.length === 0) {
      message.reply('User is not registered for any classes.');
      return;
    }

    if (chansContainingUser.length === Array.from(classes.keys()).length) {
      message.reply('User is registered for all classes.');
      return;
    }

    const chansForMessage = chansContainingUser.map((c) => c.name).join(' | ');

    this.container.messageService
      .sendTextMessage(message, `\`${chansForMessage}\``, {
        header: '`',
        footer: '`',
        reply: true,
        delimiter: ' ',
        title: `User is registered for \`${chansContainingUser.length}\` classes:\n`,
      })
      .catch((err) => {
        this.container.loggerService.warn(
          `Failed to inform ${message.author.username} what classes ${member} is in. Error info:\n${err}`
        );
      });
  }
}
