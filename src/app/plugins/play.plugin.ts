import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class PlayPlugin extends Plugin {
  public name: string = 'Play Plugin';
  public description: string = 'Plays music in a voicechannel';
  public usage: string = 'play <song name>';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length > 1;
  }

  public async execute(message: IMessage, args: string[]) {
    if (!message.member) {
      return;
    }

    const res = await this.container.musicService.queue(message, args.join(' '));
    await message.reply(res);
  }
}