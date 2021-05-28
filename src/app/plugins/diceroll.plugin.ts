import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';

export class DiceRollPlugin extends Plugin {
  public name: string = 'Dice Roll';
  public description: string = 'Roll a die';
  public usage: string = 'dice <number>';
  public pluginAlias = ['d', 'dice'];
  public permission: ChannelType = ChannelType.Public;
  public commandPattern: RegExp = /\d+/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const randomNumber: number = Math.ceil(Math.random() * +args[0]);
    message.channel.send('You rolled a `' + randomNumber + '`');
  }
}