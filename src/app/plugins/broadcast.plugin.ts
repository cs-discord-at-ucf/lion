import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType, Maybe } from '../../common/types';
import Constants from '../../common/constants';
import { RichEmbed, TextChannel } from 'discord.js';

export class BroadcastPlugin extends Plugin {
  public name: string = 'Broadcast';
  public description: string = 'Sends an annoucement to all class channels';
  public usage: string = '!broadcast <message>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public pluginChannelName: string = Constants.Channels.Staff.AdminChat;

  private _LION_PFP_URL: string =
    'https://cdn.discordapp.com/avatars/574623716638720000/7d404c72a6fccb4a3bc610490f8d7b72.png';
  private _STATE: Maybe<RichEmbed> = undefined;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length >= 1;
  }

  public async execute(message: IMessage, args: string[]) {
    const classes = this.container.classService.getClasses(ClassType.ALL);
    const classChans = [];
    for (const classObj of classes) {
      const [, chan] = classObj;
      classChans.push(chan);
    }

    if (!this._STATE) {
      this._STATE = this._createAnnoucement(args);
      message.reply(
        `You are about to send:\n\`\`\`${this._STATE.description}\`\`\`\n to \`${classChans.length}\` classes... Are you sure?\nRespond with \`confirm\` or \`cancel\``
      );
      return;
    }

    if (args[0].toLowerCase() === 'cancel') {
      this._STATE = undefined;
      message.reply('Announcement Canceled.');
      return;
    }

    if (args[0].toLowerCase() === 'confirm') {
      message.reply(
        `Sending Annoucement to \`${classChans.length}\` classes... I will let you know it has finished`
      );

      const promises = classChans.map((chan) => (chan as TextChannel).send(this._STATE));
      this._STATE = undefined;

      Promise.all(promises).then(() => message.reply('Annoucement sent!'));
    }
  }

  private _createAnnoucement(args: string[]) {
    const annoucement = args.join(' ');

    const embed = new RichEmbed();
    embed.setTitle('Annoucement!');
    embed.setColor('#ffca06');
    embed.setThumbnail(this._LION_PFP_URL);
    embed.setDescription(annoucement);

    return embed;
  }
}
