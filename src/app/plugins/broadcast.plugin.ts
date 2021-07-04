import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType, Maybe } from '../../common/types';
import { MessageEmbed, TextChannel, GuildChannel, MessageAttachment, ThreadChannel } from 'discord.js';
import Constants from '../../common/constants';

export default class BroadcastPlugin extends Plugin {
  public commandName: string = 'broadcast';
  public name: string = 'Broadcast';
  public description: string = 'Sends an announcement to all class channels';
  public usage: string =
  'broadcast <message|classes|attach> <announcement message|classNames|attachment>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Admin;
  public commandPattern: RegExp = /((message|classes)\s.+|attach|confirm|cancel)/;

  private _CHANS_TO_SEND: (GuildChannel | ThreadChannel)[] = [];
  private _ATTACHMENTS: MessageAttachment[] = [];
  private _ANNOUNCEMENT_CONTENT: Maybe<string> = null;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [subCommand, ...subCommandArgs] = args;

    if (subCommand.toLowerCase() === 'message') {
      this._handleAddMessage(subCommandArgs, message);
      return;
    }

    if (subCommand.toLowerCase() === 'attach') {
      this._handleAddAttachment(message);
      return;
    }

    if (subCommand.toLowerCase() === 'classes') {
      this._handleAddClasses(subCommandArgs, message);
      return;
    }

    if (subCommand.toLowerCase() === 'cancel') {
      this._handleCancel(message);
      return;
    }

    if (subCommand.toLowerCase() === 'confirm') {
      await this._handleConfirm(message);
      return;
    }
  }

  private _handleAddAttachment(message: IMessage) {
    if (!message.attachments.size) {
      message.reply('No attachment given.');
      return;
    }

    this._ATTACHMENTS.push(...message.attachments.array());
    message.reply('Attachment Added');
    console.log(this._ATTACHMENTS.length);
  }

  private _handleAddMessage(messageContent: string[], message: IMessage) {
    this._ANNOUNCEMENT_CONTENT = messageContent.join(' ');
    this._reportToUser(message);
  }

  private _handleCancel(message: IMessage) {
    this._ANNOUNCEMENT_CONTENT = null;
    this._CHANS_TO_SEND = [];
    message.reply('Announcement Canceled.');
  }

  private async _handleConfirm(message: IMessage) {
    if (!this._ANNOUNCEMENT_CONTENT || !this._CHANS_TO_SEND.length) {
      await message.reply('Broadcast arguments not fulfilled.');
      return;
    }

    const embeds = this._createAnnouncement();
    await message.reply(
      `Sending Announcement to \`${this._CHANS_TO_SEND.length}\` classes... ` +
        'I will let you know it has finished'
    );

    const [announcementEmbed, attachments] = embeds;
    await Promise.all(
      this._CHANS_TO_SEND.map(async (chan) => {
        await (chan as TextChannel).send({ embeds: [announcementEmbed] });
        if (attachments) {
          await (chan as TextChannel).send({ files: attachments });
        }
      })
    );
    await message.reply('Announcement sent!');

    this._ANNOUNCEMENT_CONTENT = null;
    this._ATTACHMENTS = [];
    this._CHANS_TO_SEND = [];
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
    message.reply({ embeds: (this._createAnnouncement() as MessageEmbed[]) });
    message.reply(
      `You are about to send this announcement to \`${this._CHANS_TO_SEND.length}\` classes... Are you sure?\n` +
        'Respond with `confirm` or `cancel`'
    );
  }

  private _createAnnouncement(): [MessageEmbed,  MessageAttachment[]] {
    const embed = new MessageEmbed();
    embed.setTitle('Announcement!');
    embed.setColor('#ffca06');
    embed.setThumbnail(Constants.LionPFP);
    embed.setDescription(this._ANNOUNCEMENT_CONTENT ?? '');

    if (!this._ATTACHMENTS.length) {
      return [embed, []];
    }

    // 2 messages wil be sent, the first being the embed
    // and the next containing all attachments
    return [embed, this._ATTACHMENTS];
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
    if (str === 'CS') {
      return ClassType.CS;
    }
    if (str === 'IT') {
      return ClassType.IT;
    }
    if (str === 'EE') {
      return ClassType.EE;
    }
    if (str === 'GENED') {
      return ClassType.GENED;
    }
    if (str === 'GRAD') {
      return ClassType.GRAD;
    }
    if (str === 'ALL') {
      return ClassType.ALL;
    }
    return null;
  }
}
