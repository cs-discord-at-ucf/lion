import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { GuildEmoji, EmojiIdentifierResolvable } from 'discord.js';

export class AddRolesPlugin extends Plugin {
  public name: string = 'Add Roles Plugin';
  public description: string = 'Adds roles to user.';
  public usage: string = 'addroles <role> [...roles]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  private emojis: Record<string, IRoleEmoji> = {
    alumni: { emojiName: 'okboomer', emoji: undefined },
    gradstudent: { emojiName: 'knight', emoji: undefined },
  }

  private react(role: string, message: IMessage) {
    // check to see if emoji has been instantiated
    if (!this.emojis[role].emoji) {
      this.emojis[role].emoji = this.container.guildService.get().emojis.cache
        .filter(n => n.name.toLowerCase() === this.emojis[role].emojiName).first();
    }

    if (this.emojis[role].emoji) {
      message.react(this.emojis[role].emoji as EmojiIdentifierResolvable)
    }
  }

  public async execute(message: IMessage, args: string[]) {
    const member = message.member;
    if (!member) {
      message.reply('Could not resolve you to a member');
      return;
    }

    const roles_added: string[] = [];
    for (const elem of args) {
      const role = this.container.guildService
        .get()
        .roles.cache.find((r) => r.name.toLowerCase() === elem.toLowerCase());
      if (!role) continue;
      try {
        await member.roles.add(role);
        roles_added.push(role.name);
        this.react(role.name.toLowerCase(), message);
      } catch (err) {
        this.container.loggerService.error(
          `User ${member.user.tag} attempted to add the role ${elem} but failed: ${err}`
        );
      }
    }
    if (roles_added.length <= 0) {
      message.reply(`Nothing was added successfully.`);
    } else {
      message.reply(`Successfully added: ${roles_added.join(', ')}`);
    }
  }
}

interface IRoleEmoji{
  emojiName: string,
  emoji: undefined | GuildEmoji
}
