import { GuildChannel, Snowflake, TextChannel } from 'discord.js';
import { Collection } from 'mongodb';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe, ClassType } from '../../common/types';

export class StorePinsPlugin extends Plugin {
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

    const collections = await this.container.storageService.getCollections();
    const pinCollection: Maybe<Collection<ClassPin>> = collections.pins;
    if (!pinCollection) {
      message.channel.send('Error connecting to the DB');
      return;
    }

    const promises = classChannels
      .map((chan: GuildChannel) => this._storePinsInChannel(pinCollection, chan as TextChannel))
      .filter(Boolean); // Filter out those with no pins

    const numPinsStored: number = (await Promise.all(promises)).reduce((acc: number, val) => {
      if (val) {
        return acc + val.insertedCount;
      }
      return acc;
    }, 0);

    message.channel.send(
      `Stored \`${numPinsStored}\` pins in \`${classChannels.length}\` channels`
    );
    this._state = false;
  }

  private async _storePinsInChannel(pinCollection: Collection<ClassPin>, channel: TextChannel) {
    const parsedPins: ClassPin[] = (await channel.messages.fetchPinned()).array().map((pin) => {
      return {
        messageContent: pin.content,
        className: channel.name,
        date: new Date(),
        guildID: channel.guild.id,
      };
    });

    if (parsedPins.length === 0) {
      return null;
    }

    return pinCollection.insertMany(parsedPins);
  }
}

export interface ClassPin {
  messageContent: string;
  className: string;
  date: Date;
  guildID: Snowflake;
}
