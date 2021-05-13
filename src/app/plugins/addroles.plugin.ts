import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { GuildEmoji, ReactionEmoji } from 'discord.js';

export class AddRolesPlugin extends Plugin {
  public name: string = 'Add Roles Plugin';
  public description: string = 'Adds roles to user.';
  public usage: string = 'addroles <role> [...roles]';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();

    Object.keys(this.emojis).forEach(key => {
      console.log(key)
      this.emojis[key].emoji = (this.container.guildService.get().emojis.cache
        .filter(n => n.name.toLowerCase() === this.emojis[key].emojiName).first()) as GuildEmoji;
    });
  }

  public validate(message: IMessage, args: string[]) {
    return !!args.length;
  }

  private emojis: Record<string, IRoleEmoji> = {
    alumni: { emojiName: 'knight', emoji: undefined },
    gradstudent: { emojiName: 'okboomer', emoji: undefined },
  }

  private async react(role: string, message: IMessage) {
    // let emoji = null;
    // if (role === 'alumni') {
    //   emoji = this.container.guildService.get().emojis.cache
    //     .filter(n => n.name.toLowerCase() === 'okboomer').first();
    // }
    // else if (role === 'gradstudent') {
    //   emoji = this.container.guildService.get().emojis.cache
    //     .filter(n => n.name.toLowerCase() === 'knight').first();
    // }

    // if (emoji) {
    //   message.react(emoji);
    // }

    await Promise.all(
      Object.keys(this.emojis).map(key => {
        if (role === key) {
          return message.react(this.emojis[key].emojiName);
        }
      })
    );
  }

  public async execute(message: IMessage, args: string[]) {
    console.log(this.emojis)
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
        // await this.react(role.name.toLowerCase(), message);
        // message.react('knight')
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
