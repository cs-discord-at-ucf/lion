import { GuildChannel, Snowflake, TextChannel } from 'discord.js';
import mongoose, { Document } from 'mongoose';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';
import { ClassPinModel } from '../../schemas/class.schema';

export default class StorePinsPlugin extends Plugin {
  public commandName: string = 'storepins';
  public name: string = 'Pin Plugin';
  public description: string = 'pins messages to the database';
  public usage: string = 'storepins';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Admin;
  public commandPattern: RegExp = /(confirm)?/;

  private _state: boolean = false;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const classChannels = Array.from(
      this.container.classService.getClasses(ClassType.ALL).values()
    );

    if (!this._state) {
      message.reply(
        `Are you sure you want to store *all* the pins in all \`${classChannels.length}\` class channels?\n` +
          'Reply with `!storepins confirm` if you are sure'
      );
      this._state = true;
      return;
    }

    const [subCommand] = args;
    if (subCommand.toLowerCase() !== 'confirm') {
      message.reply('Ok, canceling.');
      this._state = false;
      return;
    }

    message.channel.send(
      `Storing pins in \`${classChannels.length}\` channels. I will let you know when I am done`
    );

    if (!mongoose.connection.readyState) {
      message.channel.send('Error connecting to the DB');
      return;
    }

    const allChanPins = (
      await Promise.all(
        classChannels.map((chan: GuildChannel) => this._getPinsInChannel(chan as TextChannel))
      )
    ).flat(); // Turn into 1D array. Flattening also removes arrays of size 0

    await ClassPinModel.insertMany(allChanPins);

    message.channel.send(
      `Stored \`${allChanPins.length}\` pins in \`${classChannels.length}\` channels`
    );
    this._state = false;
  }

  private async _getPinsInChannel(channel: TextChannel): Promise<IClassPin[]> {
    return (await channel.messages.fetchPinned()).array().map((pin) => {
      return {
        messageContent: pin.content,
        className: channel.name,
        date: new Date(),
        guildID: channel.guild.id,
      };
    });
  }
}

export interface IClassPin {
  messageContent: string;
  className: string;
  date: Date;
  guildID: Snowflake;
}

export type ClassPinDocument = IClassPin & Document;
