import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe } from '../../common/types';
import { GuildEmoji, EmojiIdentifierResolvable } from 'discord.js';

export default class AddRolesPlugin extends Plugin {
  public commandName: string = 'addroles';
  public name: string = 'Add Roles Plugin';
  public description: string = 'Adds roles to user.';
  public usage: string = 'addroles <role> [...roles]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  private _blacklistedRoles: string[] = ['suspended'];
  private _emojis: Record<string, IRoleEmoji> = {
    alumni: { emojiName: 'okboomer', emoji: undefined },
    gradstudent: { emojiName: 'knight', emoji: undefined },
  };

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  private async _react(role: string, message: IMessage) {
    // check to see if role should have a reaction
    if (!this._emojis[role]) {
      return;
    }

    // check to see if emoji has been instantiated
    if (!this._emojis[role].emoji) {
      this._emojis[role].emoji = this.container.guildService
        .get()
        .emojis.cache.filter((n) => n.name.toLowerCase() === this._emojis[role].emojiName)
        .first();
    }

    if (this._emojis[role].emoji) {
      await message.react(this._emojis[role].emoji as EmojiIdentifierResolvable);
    }
  }

  public async execute(message: IMessage, args: string[]) {
    const member = message.member;
    if (!member) {
      await message.reply('Could not resolve you to a member');
      return;
    }

    const roles_added: string[] = [];
    for (const elem of args) {
      if (this._blacklistedRoles.includes(elem.toLowerCase())) {
        continue;
      }

      const role = this.container.guildService
        .get()
        .roles.cache.find((r) => r.name.toLowerCase() === elem.toLowerCase());
      if (!role) {
        continue;
      }
      try {
        await member.roles.add(role);
        roles_added.push(role.name);
        await this._react(role.name.toLowerCase(), message);
      } catch (err) {
        this.container.loggerService.error(
          `User ${member.user.tag} attempted to add the role ${elem} but failed: ${err}`
        );
      }
    }
    if (roles_added.length <= 0) {
      message.reply('Nothing was added successfully.');
    } else {
      message.reply(`Successfully added: ${roles_added.join(', ')}`);
    }
  }
}

interface IRoleEmoji {
  emojiName: string;
  emoji: Maybe<GuildEmoji>;
}
