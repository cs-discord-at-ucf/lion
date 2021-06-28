import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export default class CoinToss extends Plugin {
  public commandName: string = 'cointoss';
  public name: string = 'Coin Toss Plugin';
  public description: string = 'Ask Lion to toss a coin or if given arguments, choose among the arguments.';
  public usage: string = '!cointoss || !pick <arg_1> <arg_2> ... <arg_n>';
  public pluginAlias: string[] = ['pick', 'select', 'cointoss', 'coin', 'toss', 'ct'];
  public permission: ChannelType = ChannelType.Public;
  
  private _embed: MessageEmbed = new MessageEmbed();
  private _coinImg: string = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/285/coin_1fa99.png';
  private _wandImg: string = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/magic-wand_1fa84.png';
  private _defaultArgs: string[] = ['Heads', 'Tails'];

  constructor(public container: IContainer) {
    super();
  }

  public execute(message: IMessage, args: string[]) {
    const responses: string[] = [];

    if (args.length === 0) {
      this._embed.setAuthor('Lion flipped a coin and it lands on...', this._coinImg);
      responses.push(...this._defaultArgs);
    } else {
      this._embed.setAuthor('Lion chooses...', this._wandImg);
      responses.push(...args);
    }

    const choice = Math.floor(Math.random() * responses.length);
    this._embed.setColor('#0099ff').setTitle(responses[choice]);
    
    message.reply(this._embed);
  }
} 
