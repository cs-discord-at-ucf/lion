import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { GuildChannel, GuildMember, TextChannel, Role } from 'discord.js';

export class TaPlugin extends Plugin {
  public name: string = 'TA Plugin';
  public description: string = 'Allows TAs to register for classes.';
  public usage: string = 'ta register <class_name> | ta ask <question>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Private;

  private _TA_ROLE = 'Teaching Assistant';
  private _roleCache: Record<string, Maybe<Role>> = {
    [this._TA_ROLE]: undefined,
  };

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  public async execute(message: IMessage, args?: string[]) {
    if (!args?.length) {
      return;
    }

    if (!this._roleCache[this._TA_ROLE]) {
      this._roleCache[this._TA_ROLE] = this.container.guildService
        .get()
        .roles.filter((r) => r.name === this._TA_ROLE)
        .first();
    }

    const member = this.container.guildService.get().members.get(message.author.id);
    if (!member) {
      return;
    }

    const [subcommand, ...question] = args;
    if (subcommand === 'ask') {
      this._handleAsk(message, question.join(' '));
      return;
    }

    const hasRole = member.roles.array().some((r) => r === this._roleCache[this._TA_ROLE]);
    if (!hasRole) {
      message.reply('You are not a TA!');
      return;
    }

    if (subcommand === 'register') {
      this._handleRegister(message);
      return;
    }

    if (subcommand === 'remove') {
      this._handleRemove(message);
      return;
    }

    message.reply('Invalid sub-command');
  }

  private _handleAsk(message: IMessage, question: string) {
    const channelTopic = (<TextChannel>message.channel).topic || '';
    const hasTA: Boolean = channelTopic.indexOf('TA: ') !== -1;

    if (!hasTA) {
      message.reply('There are no TAs registered in this channel');
      return;
    }

    const TA_tags = channelTopic.split('| TA: ')[1].split(' ');
    let mentions = '';
    this.container.guildService
      .get()
      .members.filter((member) => TA_tags.some((TA: string) => member.user.tag === TA))
      .forEach((TA: GuildMember) => {
        mentions += `${TA.user} `;
      });

    message.channel.send(`${message.author} asks: \n> ${question}\n${mentions}`);
  }

  private _handleRegister(message: IMessage) {
    const channel: GuildChannel = message.channel as GuildChannel;
    const channelTopic = (channel as TextChannel).topic || '';

    const hasTA = Boolean(channelTopic.indexOf('TA: ') !== -1);
    if (!hasTA) {
      channel.setTopic(`${channelTopic} | TA: ${message.author.tag}`);
      return;
    }

    let existingTAs;
    if (channelTopic === '') {
      existingTAs = channelTopic.slice('| TA: '.length);
    } else {
      [, existingTAs] = channelTopic.split('| TA: ');
    }

    if (existingTAs.split(' ').includes(message.author.tag)) {
      message.reply(`You are already registered as a TA for ${channel.name}.`);
      return;
    }

    channel
      .setTopic(`${channelTopic} ${message.author.tag}`)
      .then((newChan) => message.reply(`Successfully registered as TA in ${newChan.name}`));
  }

  private _handleRemove(message: IMessage) {
    const channel: GuildChannel = message.channel as GuildChannel;
    const channelTopic = (channel as TextChannel).topic || '';

    const hasTA = Boolean(channelTopic.indexOf('TA: ') !== -1);
    if (!hasTA) {
      message.reply(`You are not a TA in ${channel.name}`);
      return;
    }

    let originalTopic, existingTAs;
    if (channelTopic.indexOf('| TA: ') === 0) {
      originalTopic = '';
      existingTAs = channelTopic.slice('| TA: '.length);
    } else {
      [originalTopic, existingTAs] = channelTopic.split('| TA: ');
    }

    const newTAs = this._removeElement(existingTAs.split(' '), message.author.tag);
    if (newTAs.length === 0) {
      channel.setTopic(originalTopic);
      return;
    }

    channel
      .setTopic(`${originalTopic} | TA: ${newTAs.join(' ')}`)
      .then((newChan) => message.reply(`Successfully unregistered as TA in ${newChan.name}`));
  }

  private _removeElement(arr: string[], toRemove: string): string[] {
    const newArr: string[] = [];
    arr.forEach((e) => {
      if (e !== toRemove) {
        newArr.push(e);
      }
    });
    return newArr;
  }
}
