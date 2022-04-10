import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';
import Constants from '../../common/constants';
import { Moderation } from '../../services/moderation.service';

export default class CheckClassesPlugin extends Plugin {
  public commandName: string = 'checkclasses';
  public name: string = 'Check Class';
  public description: string = 'lists the classes someone is in';
  public usage: string = 'checkclasses <user>';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override commandPattern: RegExp = /^(([^#]+#\d{4})|\d{17,18})$/;

  private _MAX_CHANS_SHOWN: number = 10;

  public override validate(message: IMessage, args: string[]) {
    return args.length != 0 && !!Moderation.Helpers.validateUser(args[0]);
  }

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const userHandle = args.join(' ');

    const member = await Moderation.Helpers.resolveUser(
      this.container.guildService.get(),
      userHandle
    );

    if (!member) {
      await message.reply('User not found.');
      return;
    }

    const classes = this.container.classService.getClasses(ClassType.ALL);
    const chansContainingUser = Array.from(classes.values()).filter((chan) =>
      Boolean(chan.permissionsFor(member.id)?.has('VIEW_CHANNEL'))
    );

    if (chansContainingUser.length === 0) {
      await message.reply('User is not registered for any classes.');
      return;
    }

    if (chansContainingUser.length === Array.from(classes.keys()).length) {
      await message.reply('User is registered for all classes.');
      return;
    }

    const title = `User is registered for \`${chansContainingUser.length}\` classes:\n`;
    let shownChannels = chansContainingUser
      .slice(0, this._MAX_CHANS_SHOWN) // Cut down to max length
      .map((c) => c.name) // Convert to name
      .join('\n');

    if (chansContainingUser.length > this._MAX_CHANS_SHOWN) {
      shownChannels += `\nand ${chansContainingUser.length - this._MAX_CHANS_SHOWN} more...`;
    }
    await message.reply(`${title}\`\`\`\n${shownChannels}\n\`\`\``);
  }
}
