import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { Poll } from '../../services/poll.service';

export default class PollPlugin extends Plugin {
  public commandName: string = 'poll';
  public name: string = 'Poll';
  public description: string = 'creates a poll';
  public usage: string = 'poll <time> <question> \\n <answer1> \\n <answer2>...';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public commandPattern: RegExp = /\d+ .+(\n.+){1,9}/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [temp, ...answers] = args.join(' ').split('\n');
    const [time, ...question] = temp.split(' ');
    const NUM_TO_EMOJI = this.container.pollService.NUM_TO_EMOJI;

    if (answers.length > NUM_TO_EMOJI.length) {
      await message.reply(`Sorry, I only support up to **${NUM_TO_EMOJI.length}** answers.`);
      return;
    }

    if (!parseInt(time)) {
      await message.reply('Invalid amount of time.');
      return;
    }

    if (parseInt(time) > 60) {
      await message.reply('Sorry, I only allow polls for up to an hour.');
      return;
    }

    const embed = this.container.pollService.createStartEmbed(
      parseInt(time),
      question.join(' '),
      answers
    );

    // Send embed and react will all possible answers
    await message.channel.send({ embeds: [embed] }).then(async (sentMsg) => {
      const promises = answers.map((_, i) => sentMsg.react(NUM_TO_EMOJI[i]));
      await Promise.all(promises);

      // Append poll to pollService
      const poll = new Poll(parseInt(time), sentMsg, question.join(' '), answers);
      this.container.pollService.addPoll(poll);
    });
  }
}
