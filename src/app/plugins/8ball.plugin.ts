import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export default class EightBallPlugin extends Plugin {
  public commandName: string = '8ball';
  public name: string = '8Ball Plugin';
  public description: string = 'A magic fortune telling 8Ball.';
  public usage: string = '8ball';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  private _embed: MessageEmbed = new MessageEmbed();
  private _IMAGE: string = 'https://cdn.emojidex.com/emoji/seal/8ball.png';
  private _responses: string[] = [
    'Corgo the Clever gifts you some of his infinite IQ. Outlook now favorable.',
    'Szum blesses you. It is certain.',
    'The light of Szum shines upon you. Count on it.',
    'Guha the Great decides your fate. You are now an IT major.',
    "Szum the One True God punishes you for your blasphemy worshipping other false idols. Don't count on it.",
    'You have been cursed and Guaca the Goof is now your partner in a group project. Not looking so good...',
    'Joey reveals to you the sacred way of the Leetcoder. You may rely on it.',
    'Guaca the Goof teaches you the forbidden art of breaking the Golden Rule. Outlook favorable.',
    'Juan bullies bread, causing a chain reaction of unfavorable events. Probably not.',
    'bread gifts you with all the luck in the loaf. The best outcome is forseen.',
  ];

  constructor(public container: IContainer) {
    super();
  }

  public execute(message: IMessage) {
    const response = this._responses[Math.floor(Math.random() * this._responses.length)];
    this._embed.setColor('#0099ff').setTitle(response);
    this._embed.setAuthor('The magic 8ball says...', this._IMAGE);
    message.reply({ embeds: [this._embed] });
  }
}
