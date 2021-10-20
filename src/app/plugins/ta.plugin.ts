import mongoose, { Document } from 'mongoose';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { Guild, GuildMember, Snowflake, TextChannel, User } from 'discord.js';
import Constants from '../../common/constants';
import { ClassTAModel } from '../../schemas/class.schema';

export default class TaPlugin extends Plugin {
  public commandName: string = 'ta';
  public name: string = 'TA Plugin';
  public description: string = 'Allows TAs to register for classes.';
  public usage: string = 'ta <register|remove>\nta ask <question>';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Private;
  public override commandPattern: RegExp = /(register|remove|ask .+)/;

  private _ALLOWED_ROLES = [Constants.Roles.TeachingAssistant, Constants.Roles.Professor];

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [subCommand, ...question] = args;

    const channel = message.channel as TextChannel;
    const isClassChan = this.container.classService.isClassChannel(channel.name);
    if (!isClassChan || !message.guild) {
      await message.reply('Please use this command in a class channel');
      return;
    }

    if (subCommand === 'ask') {
      await this._handleAsk(message, question.join(' '));
      return;
    }

    const member = message.member;
    if (!member) {
      await message.reply('I had an issue getting your member status');
      return;
    }

    const hasAllowedRole = this._ALLOWED_ROLES.some((role) =>
      this.container.userService.hasRole(member, role)
    );
    if (!hasAllowedRole) {
      await message.reply('You must be a TA to use this command');
      return;
    }

    if (subCommand === 'register') {
      await message.reply(await this._handleRegister(message, message.guild));
      return;
    }

    message.reply(await this._handleRemove(message, message.guild));
  }

  private async _handleRegister(message: IMessage, guild: Guild): Promise<string> {
    try {
      const TACollection = this._getCollection();
      const isRegistered = Boolean(
        await TACollection.findOne({
          userID: message.author.id,
          guildID: guild.id,
          chanID: message.channel.id,
        })
      );
      if (isRegistered) {
        return 'You are already registered as a TA for this class';
      }

      await TACollection.create({
        userID: message.author.id,
        guildID: guild.id,
        chanID: message.channel.id,
      });

      await this._setTopic(message, TACollection);
    } catch (e) {
      return 'Error registering as a TA';
    }

    // After register in the DB, give perms for deyeeting messages
    await this._setManageMessagesForChannel(message.channel as TextChannel, message.author, true);
    return 'Successfully registered as a TA';
  }

  private async _handleRemove(message: IMessage, guild: Guild): Promise<string> {
    try {
      const TACollection = this._getCollection();
      await TACollection.deleteOne({
        guildID: guild.id,
        userID: message.author.id,
        chanID: message.channel.id,
      });

      await this._setTopic(message, TACollection);
    } catch (e) {
      return 'Error removing as a TA';
    }

    // After remove from the DB, remove perms for deyeeting messages
    await this._setManageMessagesForChannel(message.channel as TextChannel, message.author, false);
    return 'Successfully removed as a TA';
  }

  private _setManageMessagesForChannel(chan: TextChannel, user: User, canManage: boolean) {
    return chan.permissionOverwrites
      .edit(user, {
        MANAGE_MESSAGES: canManage,
      })
      .catch((e) =>
        this.container.loggerService.warn(`Error giving TA permission to manage messages: ${e}`)
      );
  }

  private async _setTopic(message: IMessage, TACollection: mongoose.Model<TADocument>) {
    const TAs = await TACollection.find({
      guildID: message.guild?.id,
      chanID: message.channel.id,
    });

    const members = TAs.map((t) =>
      this.container.guildService.get().members.cache.get(t.userID)
    ).filter(Boolean);

    const chan = message.channel as TextChannel;
    const usernames = members.map((m) => (m as GuildMember).user.username);
    const [className] = (chan.topic ?? '').split(' | TAs:');
    chan.setTopic(`${className} | TAs: ${usernames.join(', ')}`);
  }

  private async _handleAsk(message: IMessage, question: string) {
    const TAs: GuildMember[] = await this._getTAs(message, message.channel as TextChannel);
    if (!TAs.length) {
      await message.reply('There are no TAs registered for this class');
      return;
    }

    const mentions = TAs.map((m) => m.user.toString()).join(' ');
    message.channel.send(`${mentions}\n${message.author} asks: \`\`\`${question}\`\`\``);
  }

  private async _getTAs(message: IMessage, chan: TextChannel): Promise<GuildMember[]> {
    if (!mongoose.connection.readyState) {
      await message.reply('Error connecting to the DB');
      return [];
    }

    const fromCollection = (
      await ClassTAModel.find({
        guildID: chan.guild.id,
      })
    ).filter((e) => e.chanID === chan.id);

    return fromCollection.reduce((acc: GuildMember[], entry: ITAEntry) => {
      const member = this.container.guildService.get().members.cache.get(entry.userID);
      if (member) {
        acc.push(member);
      }

      return acc;
    }, []);
  }

  private _getCollection(): mongoose.Model<TADocument> {
    if (!mongoose.connection.readyState) {
      throw new Error('Error getting data from DB');
    }

    return ClassTAModel;
  }
}

export interface ITAEntry {
  userID: Snowflake;
  chanID: Snowflake;
  guildID: Snowflake;
}

export type TADocument = ITAEntry & Document;
