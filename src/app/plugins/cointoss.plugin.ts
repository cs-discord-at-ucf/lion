import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export class CoinToss extends Plugin {
  public name: string = 'Coin Toss Plugin';
  public description: string = 'Ask Lion to toss a coin.';
  public usage: string = 'toss';
  public pluginAlias: string[] = ['ct', 'ht', 'coin', 'toss', 'cointoss'];
  public permission: ChannelType = ChannelType.Public;
  private _embed: MessageEmbed = new MessageEmbed();
  private _IMAGE: string = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/285/coin_1fa99.png';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const _responses: string[] = ['Heads', 'Tails'];
    const choice = Math.floor(Math.random() * _responses.length)
    this._embed.setColor('#0099ff').setTitle(_responses[choice]);
    this._embed.setAuthor('Lion flipped a coin and it lands on...', this._IMAGE);
    message.reply(this._embed);
  }
}
