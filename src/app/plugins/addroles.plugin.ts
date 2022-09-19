import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, Maybe, RoleType } from '../../common/types';
import { GuildEmoji, EmojiIdentifierResolvable, Role } from 'discord.js';

export default class AddRolesPlugin extends Plugin {
  public commandName: string = 'addroles';
  public name: string = 'Add Roles Plugin';
  public description: string = 'Adds roles to user.';
  public usage: string = 'addroles <role> [...roles]';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;
  public override minRoleToRun = RoleType.Suspended;

  public static readonly BLACKLISTED_ROLES: string[] = ['suspended'];

  private _emojis: Record<string, IRoleEmoji> = {
    alumni: { emojiName: 'okboomer', emoji: undefined },
    gradstudent: { emojiName: 'knight', emoji: undefined },
  };

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  private async _react(role: string, message: IMessage) {
    // check to see if role should have a reaction
    if (!this._emojis[role]) {
      return;
    }

    // check to see if emoji has been instantiated
    if (!this._emojis[role].emoji) {
      this._emojis[role].emoji = this.container.guildService.getEmoji(this._emojis[role].emojiName);
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

    const userRoleNames = member.roles.cache.map((role) => role.name.toLowerCase());
    if (userRoleNames.some((roleName) => roleName === 'suspended')) {
      await message.reply('You cannot add roles while suspended');
      return;
    }

    const filteredRoles = args
      .map((name) => name.toLowerCase())
      .filter((roleName) => !AddRolesPlugin.BLACKLISTED_ROLES.includes(roleName)) // Make sure not in blacklist
      .map((roleName) =>
        this.container.guildService.get().roles.cache.find((r) => r.name.toLowerCase() === roleName)
      )
      .filter((role) => Boolean(role)) as Role[];

    await Promise.all(
      filteredRoles.map((role) => {
        return Promise.all([member.roles.add(role), this._react(role.name.toLowerCase(), message)]);
      })
    );

    if (filteredRoles.length <= 0) {
      message.reply('Nothing was added successfully.');
    } else {
      message.reply(`Successfully added: ${filteredRoles.map((r) => r.name).join(', ')}`);
    }
  }
}

interface IRoleEmoji {
  emojiName: string;
  emoji: Maybe<GuildEmoji>;
}
