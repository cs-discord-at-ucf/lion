import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';

export class PollPlugin extends Plugin {
  public name: string = 'Poll';
  public description: string = 'creates a poll';
  public usage: string = 'poll <question> \\n <answer1> \\n <answer2>...';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;

  private _NUM_TO_WORD: string[] = [
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
  ];

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length > 0 && args.join(' ').includes('\n'); //Make sure there is atleast one answer
  }

  public async execute(message: IMessage, args: string[]) {
    const [question, ...answers] = args.join(' ').split('\n');
    if (answers.length > 9) {
      await message.reply('Sorry, I only support up to **9** answers.');
      return;
    }

    const embed = new MessageEmbed();
    embed.setTitle(question);
    embed.setColor('#fcb103');
    embed.setThumbnail(Constants.LionPFP);
    embed.setDescription(answers.map((a: string, i: number) => `:${this._NUM_TO_WORD[i]}: ${a}`));
    await message.channel.send(embed);
  }
}
