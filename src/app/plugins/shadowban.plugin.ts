import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup } from '../../common/types';
import Constants from '../../common/constants';
import { CategoryChannel, ChannelType, Collection, GuildChannel, User } from 'discord.js';

export default class ShadowBanPlugin extends Plugin {
  public commandName: string = 'shadowban';
  public name: string = 'Shadowban Plugin';
  public description: string = 'Disables a users ability to view public channels.';
  public usage: string = 'shadowban <ban|unban> <user>';
  public override pluginAlias = [];
  public permission: ChannelGroup = ChannelGroup.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override commandPattern: RegExp = /(ban|unban)\s[^#]+#\d{4}/;

  private _BANNED_CATEGORIES: string[] = [
    Constants.Categories.General,
    Constants.Categories.DailyRoutine,
    Constants.Categories.Help,
    Constants.Categories.SpecialTopics,
    Constants.Categories.Misc,
    Constants.Categories.AudioChannels,
  ];

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [subCommand, ...userArg] = args;
    const targetUser = userArg.join(' ');
    const user = this.container.guildService
      .get()
      .members.cache.filter((m) => m.user.tag === targetUser)
      .first()?.user;

    if (!user) {
      await message.reply('User not found.');
      return;
    }

    if (subCommand === 'ban') {
      await this._applyToChannels(this._banUser(user));
      await message.reply(`${user.tag} has been shadowbanned`);
    } else if (subCommand === 'unban') {
      await this._applyToChannels(this._unbanUser(user));
      await message.reply(`${user.tag} has been unshadowbanned`);
    }
  }

  private async _applyToChannels(callback: (chan: GuildChannel) => void) {
    const categories = this.container.guildService
      .get()
      .channels.cache.filter((chan) => chan.type === ChannelType.GuildCategory) as Collection<
      string,
      CategoryChannel
    >;

    const catsToBan = categories.filter((cat: CategoryChannel) => {
      const chanName = cat.name.toUpperCase();
      return this._BANNED_CATEGORIES.some((n) => chanName === n);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises = catsToBan.reduce((acc: any, cat: CategoryChannel) => {
      acc.push(...[...cat.children.cache.values()].map(callback));
      return acc;
    }, []);

    await Promise.all(promises);
  }

  private _banUser(user: User) {
    return async (chan: GuildChannel) => {
      await chan.permissionOverwrites.create(user.id, {
        ViewChannel: false,
      });
    };
  }

  private _unbanUser(user: User) {
    return async (chan: GuildChannel) => {
      await chan.permissionOverwrites.cache.get(user.id)?.delete();
    };
  }
}
