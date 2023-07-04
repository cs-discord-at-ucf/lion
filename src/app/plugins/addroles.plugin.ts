import { Plugin } from '../../common/plugin';
import Constants from '../../common/constants';
import { IContainer, IMessage, ChannelGroup, Maybe, RoleType } from '../../common/types';
import { GuildEmoji, EmojiIdentifierResolvable, Role, TextChannel, GuildMember } from 'discord.js';
import { getRandom } from '../../common/utils';

export default class AddRolesPlugin extends Plugin {
  public commandName: string = 'addroles';
  public name: string = 'Add Roles Plugin';
  public description: string = 'Adds roles to user.';
  public usage: string = 'addroles <role> [...roles]';
  public override pluginAlias = [];
  public permission: ChannelGroup = ChannelGroup.Bot;
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

    const alumniChannel = this.container.guildService.getChannel(
      Constants.Channels.Public.AlumniLounge
    ) as TextChannel;
    const gradStudChannel = this.container.guildService.getChannel(
      Constants.Channels.Public.GradCafe
    ) as TextChannel;

    // check for alumni or grad student role, and send a random welcome
    filteredRoles.forEach((e) => {
      const roleName = e.name.toLowerCase();

      if (roleName === Constants.Roles.Alumni.toLowerCase()) {
        alumniChannel.send(this._getRandomWelcome(member, roleName));
      }

      if (roleName === Constants.Roles.GradStudent.toLowerCase()) {
        gradStudChannel.send(this._getRandomWelcome(member, roleName));
      }
    });

    if (filteredRoles.length <= 0) {
      message.reply('Nothing was added successfully.');
    } else {
      message.reply(`Successfully added: ${filteredRoles.map((r) => r.name).join(', ')}`);
    }
  }

  private _getRandomWelcome(user: GuildMember, role: string): string {
    if (role === Constants.Roles.Alumni.toLowerCase()) {
      return getRandom(this._alumniWelcomes(user.toString()));
    }

    return getRandom(this._gradStudWelcomes(user.toString()));
  }

  private _alumniWelcomes(user: string) {
    return [
      `Congratulations ${user} on all your hard work!`,
      `You made it, ${user}! Congratulations!`,
      `Congratulations and BRAVO, ${user}`,
      `This calls for celebrating! Congratulations ${user}!`,
      `You did it! Congrats ${user}!`,
      `Caps off to you, Graduate! Well done, ${user}!`,
    ];
  }

  private _gradStudWelcomes(user: string) {
    return [
      `Good luck enduring a few more years of hell ${user}!`,
      `Hope grad school doesn't take a toll on ya ${user}`,
      `Welcome ${user}, you are now a Grad Knight!`,
    ];
  }
}

interface IRoleEmoji {
  emojiName: string;
  emoji: Maybe<GuildEmoji>;
}
