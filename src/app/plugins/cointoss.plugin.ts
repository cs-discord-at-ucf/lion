import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export class CoinToss extends Plugin {
  public name: string = 'Coin Toss Plugin';
  public description: string = 'Ask Lion to toss a coin or if given arguments, choose among the arguments.';
  public usage: string = '!cointoss || !pick <arg_1> <arg_2> ... <arg_n>';
  public pluginAlias: string[] = ['pick', 'select', 'cointoss', 'coin', 'toss', 'ct'];
  public permission: ChannelType = ChannelType.Public;
  private _embed: MessageEmbed = new MessageEmbed();
  private _coinImg: string = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/285/coin_1fa99.png';
  private _defaultArgs: string[] = ['Heads', 'Tails'];
  private _responses: string[] = [];
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (args?.length === 0) {
      this._embed.setAuthor('Lion flipped a coin and it lands on...', this._coinImg);
      this._responses.push(...this._defaultArgs);
    } else {
      const wandImg = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/magic-wand_1fa84.png';
      this._embed.setAuthor('Lion chooses...', wandImg);
      this._responses.push(...args!);
    }

    const choice = Math.floor(Math.random() * this._responses.length)
    this._embed.setColor('#0099ff').setTitle(this._responses[choice]);
    
    message.reply(this._embed);
  }
}