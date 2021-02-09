import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';

export class Poll {
  start: Date;
  expiry: number;
  msg: IMessage;
  answers: string[];

  constructor(exp: number, _msg: IMessage, _answers: string[]) {
    this.start = new Date();
    this.expiry = exp;
    this.msg = _msg;
    this.answers = _answers;
  }
}

export class PollPlugin extends Plugin {
  public name: string = 'Poll';
  public description: string = 'creates a poll';
  public usage: string = 'poll <time> <question> \\n <answer1> \\n <answer2>...';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;

  private _NUM_TO_EMOJI: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length > 0 && args.join(' ').includes('\n'); //Make sure there is atleast one answer
  }

  public async execute(message: IMessage, args: string[]) {
    const [temp, ...answers] = args.join(' ').split('\n');
    const [time, ...question] = temp.split(' ');
    if (answers.length > this._NUM_TO_EMOJI.length) {
      await message.reply(`Sorry, I only support up to **${this._NUM_TO_EMOJI.length}** answers.`);
      return;
    }

    if (!parseInt(time)) {
      await message.reply('Invalid amount of time.');
      return;
    }

    const embed = new MessageEmbed();
    embed.setTitle(question.join(' '));
    embed.setColor('#fcb103');
    embed.setThumbnail(Constants.PollThumbnail);
    embed.setDescription(answers.map((a: string, i: number) => `${this._NUM_TO_EMOJI[i]} ${a}\n`));
    embed.setFooter(`Expires in: ${parseInt(time)} minutes`);

    await message.channel.send(embed).then(async (sentMsg) => {
      const promises = answers.map((_, i) => sentMsg.react(this._NUM_TO_EMOJI[i]));
      await Promise.all(promises);

      const poll = new Poll(parseInt(time), sentMsg, answers);
      this.container.messageService.addPoll(poll);
    });
  }
}
