import { IMessage } from '../common/types';
import { MessageEmbed } from 'discord.js';

export class Poll {
  start: Date;
  expiry: Date;
  msg: IMessage;
  question: string;
  answers: string[];

  constructor(exp: number, _msg: IMessage, _question: string, _answers: string[]) {
    this.start = new Date();
    this.expiry = new Date(this.start.getTime() + exp * 60 * 1000); //Minutes to ms
    this.msg = _msg;
    this.question = _question;
    this.answers = _answers;
  }
}

export class PollService {
  public NUM_TO_EMOJI: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

  private _polls: Map<number, Poll> = new Map();
  private _POLL_THUMBNAIL =
    'https://lh3.googleusercontent.com/proxy/IaTnrKy9cYTemCPbTIEKTs' +
    'OcCLbNiX01u9G8CXyLwQ4475sdXJqIPmR7nFYydVS8hDEAOP77o6PwXPPUfzduOzK1';

  constructor() {}

  public createStartEmbed(exp: number, question: string, answers: string[]): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(question);
    embed.setColor('#fcb103');
    embed.setThumbnail(this._POLL_THUMBNAIL);
    embed.setDescription(answers.map((a: string, i: number) => `${this.NUM_TO_EMOJI[i]} ${a}\n`));
    embed.setFooter(`Expires in: ${exp} minutes`);

    return embed;
  }

  public createResultEmbed(poll: Poll): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(`Poll has concluded!`);
    embed.setColor('#fcb103');
    embed.setThumbnail(this._POLL_THUMBNAIL);
    embed.setDescription(poll.question);

    const reactions = poll.msg.reactions.cache.reduce((acc: any[], cur) => {
      const ret = {
        count: cur.count,
        emoji: cur.emoji.name,
      };
      acc.push(ret);
      return acc;
    }, []);

    //Zip 2 arrays together before sorting
    const pairs = reactions.map((e, i) => [e, poll.answers[i]]);
    pairs.sort(this._sortByCount);

    pairs.forEach((pair) => {
      const [react, answer] = pair;
      embed.addField(`Votes: ${react.count}`, `${react.emoji}: ${answer}`, false);
    });
    return embed;
  }

  private _sortByCount(a: any, b: any) {
    const [reactA] = a;
    const [reactB] = b;
    return reactA.count <= reactB.count ? 1 : -1;
  }

  public addPoll(_poll: Poll) {
    this._polls.set(_poll.start.getTime(), _poll);
  }

  public getPolls(): Map<number, Poll> {
    return this._polls;
  }

  public deletePoll(_poll: Poll) {
    this._polls.delete(_poll.start.getTime());
  }
}
