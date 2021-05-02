import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MemberUtils } from '../util/member.util';

export class SkipPlugin extends Plugin {
  public name: string = 'Play Plugin';
  public description: string = 'Plays music in a voicechannel';
  public usage: string = 'play <song name>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    if (!message.member) {
      return;
    }

    const isModerator = MemberUtils.hasRole(message.member, 'moderator');
    if (!isModerator) {
      await message.reply('You must be a moderator to use this plugin.');
      return;
    }

    const ret = await this.container.musicService.skip();
    if (!ret) {
      await message.react('👍');
      return;
    }

    await message.reply(ret);
  }
}
