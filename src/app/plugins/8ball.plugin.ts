import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { RichEmbed } from 'discord.js';

export class EightBallPlugin extends Plugin {
  public name: string = '8Ball Plugin';
  public description: string = 'A magic fortune telling 8Ball.';
  public usage: string = '8ball';
  public permission: ChannelType = ChannelType.Public;
  private _embed: RichEmbed = new RichEmbed();
  private _IMAGE: string = 'https://cdn.emojidex.com/emoji/seal/8ball.png';
  private _responses: string[] = [
    'Corgo the Clever gifts you some of his infinite IQ. Outlook now favorable.',
    'Szum blesses you. It is certain.',
    'The light of Szum shines upon you. Count on it.',
    'Guha the Great decides your fate. You are now an IT major.',
    'Szum the One True God punishes you for your blasphemy worshipping other false idols. Don\'t count on it.',
    'You have been cursed and Guaca the Goof is now your partner in a group project. Not looking so good...',
    'Joey reveals to you the sacred way of the Leetcoder. You may rely on it.',
    'Guaca the Goof teaches you the forbidden art of breaking the Golden Rule. Outlook favorable.',
  ];

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const response = this._responses[Math.floor(Math.random() * this._responses.length)];
    this._embed.setColor('#0099ff').setTitle(response);
    this._embed.setAuthor(
      'The magic 8ball says...',
      this._IMAGE
    );
    message.reply(this._embed);
  }
}
