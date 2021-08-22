import { IContainer, IHandler, IMessage } from '../../common/types';

export class MomaHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    if (message.content.toLowerCase().startsWith('who ')) {
      await message.reply('https://tenor.com/view/nba-shaquille-o-neal-yo-moma-point-laugh-gif-4759702');
    }
  }
}
