import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType, Maybe } from '../../common/types';
import { RichEmbed, TextChannel, GuildChannel } from 'discord.js';
import Constants from '../../common/constants';

export class BroadcastPlugin extends Plugin {
  public name: string = 'Broadcast';
  public description: string = 'Sends an annoucement to all class channels';
  public usage: string = '!broadcast <message|classes> <announcement message|classNames>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Admin;

  private _EMBED_TO_SEND: Maybe<RichEmbed> = undefined;
  private _CHANS_TO_SEND: GuildChannel[] = [];

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length >= 1;
  }

  public async execute(message: IMessage, args: string[]) {
    const [sub_command, ...rest] = args;

    if (sub_command.toLowerCase() === 'message') {
      this._handleAddMessage(rest, message);
      return;
    }

    if (sub_command.toLowerCase() === 'classes') {
      this._handleAddClasses(rest, message);
      return;
    }

    if (sub_command.toLowerCase() === 'cancel') {
      this._handleCancel(message);
      return;
    }

    if (sub_command.toLowerCase() === 'confirm') {
      await this._handleConfirm(message);
      return;
    }

    message.reply(`Invalid sub_command, try \`${this.usage}\``);
  }

  private _handleAddMessage(rest: string[], message: IMessage) {
    this._EMBED_TO_SEND = this._createAnnoucement(rest);
    this._reportToUser(message);
  }

  private _handleCancel(message: IMessage) {
    this._EMBED_TO_SEND = undefined;
    this._CHANS_TO_SEND = [];
    message.reply('Announcement Canceled.');
  }

  private async _handleConfirm(message: IMessage) {
    if (!this._EMBED_TO_SEND || !this._CHANS_TO_SEND.length) {
      message.reply('Broadcast arguments not fulfilled.');
      return;
    }

    message.reply(
      `Sending Annoucement to \`${this._CHANS_TO_SEND.length}\` classes... ` +
        `I will let you know it has finished`
    );

    const promises = this._CHANS_TO_SEND.map((chan) =>
      (chan as TextChannel).send(this._EMBED_TO_SEND)
    );
    this._EMBED_TO_SEND = undefined;
    this._CHANS_TO_SEND = [];

    Promise.all(promises).then(() => message.reply('Annoucement sent!'));
  }

  private _handleAddClasses(classNames: string[], message: IMessage) {
    classNames.forEach((name) => {
      // Check if target is a classType
      const classType: Maybe<ClassType> = this._strToClassType(name.toUpperCase());
      if (classType) {
        const classes = this._getClassesFromClassMap(
          this.container.classService.getClasses(classType)
        );
        this._CHANS_TO_SEND.push(...classes);
        return;
      }

      // Otherwise, its a class name
      const targetChannel = this.container.guildService.getChannel(name.toLowerCase());
      if (targetChannel) {
        this._CHANS_TO_SEND.push(targetChannel);
      }
    });

    // Remove possible duplicates from list
    this._CHANS_TO_SEND = [...new Set(this._CHANS_TO_SEND)];
    this._reportToUser(message);
  }

  private _reportToUser(message: IMessage) {
    message.reply(
      `You are about to send:\n\`\`\`${this._EMBED_TO_SEND?.description}\`\`\`\n` +
        `to \`${this._CHANS_TO_SEND.length}\` classes... Are you sure?\n` +
        `Respond with \`confirm\` or \`cancel\``
    );
  }

  private _createAnnoucement(args: string[]) {
    const annoucement = args.join(' ');

    const embed = new RichEmbed();
    embed.setTitle('Annoucement!');
    embed.setColor('#ffca06');
    embed.setThumbnail(Constants.LionPFP);
    embed.setDescription(annoucement);

    return embed;
  }

  private _getClassesFromClassMap(map: Map<string, GuildChannel>) {
    const classChans = [];
    for (const classObj of map) {
      const [, chan] = classObj;
      classChans.push(chan);
    }

    return classChans;
  }

  private _strToClassType(str: string): Maybe<ClassType> {
    if (str === 'CS') return ClassType.CS;
    if (str === 'IT') return ClassType.IT;
    if (str === 'EE') return ClassType.EE;
    if (str === 'GENED') return ClassType.GENED;
    if (str === 'GRAD') return ClassType.GRAD;
    if (str === 'ALL') return ClassType.ALL;
    return undefined;
  }
}
