import { TextChannel } from 'discord.js';
import { IContainer, IHandler, IMessage } from '../../common/types';
import Constants from '../../common/constants';

export class MomaHandler implements IHandler {
  private whitelistedChannels: Array<string> = [
    Constants.Channels.Public.General,
    Constants.Channels.Public.Memes,
    Constants.Channels.Public.Vehicles,
    Constants.Channels.Public.Fitness,
    Constants.Channels.Public.Food,
    Constants.Channels.Public.VideoGames
  ]

  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    if (!message.content.toLowerCase().startsWith('who ') || !message.content.toLowerCase().startsWith('who')) {
      return;
    }

    const chan = message.channel as TextChannel;
    if (!this.whitelistedChannels.includes(chan.name.toLowerCase())) {
      return;
    }

    const coinFlip: number = Math.floor(Math.random() * 2);

    if (coinFlip === 0) {
      await message.reply('https://tenor.com/view/nba-shaquille-o-neal-yo-moma-point-laugh-gif-4759702');
    }
  }
}
