import { IMessage } from '../common/types';
import { MessageEmbed } from 'discord.js';
import { ClientService } from './client.service';

export class Poll {
  start: Date;
  expiry: Date;
  msg: IMessage;
  question: string;
  answers: string[];

  constructor(exp: number, _msg: IMessage, _question: string, _answers: string[]) {
    this.start = new Date();
    this.expiry = new Date(this.start.getTime() + exp * 60 * 1000); // Minutes to ms
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

  constructor(private _clientService: ClientService) {}

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
    embed.setTitle('Poll has concluded!');
    embed.setColor('#fcb103');
    embed.setThumbnail(this._POLL_THUMBNAIL);
    embed.setDescription(poll.question);

    const reactions = poll.msg.reactions.cache.reduce((acc: IReactionCount[], cur) => {
      if (cur.users.cache.first() !== this._clientService.user) {
        return acc;
      }

      const ret = {
        count: cur.count ?? 0,
        emoji: cur.emoji.name,
      };
      acc.push(ret);
      return acc;
    }, []);

    // Zip 2 arrays together before sorting
    const pairs: IReactionAnswer[] = reactions.map((e, i) => ({
      reaction: e,
      answer: poll.answers[i],
    }));
    pairs.sort(this._sortByCount);

    pairs.forEach((pair) => {
      const { reaction, answer } = pair;
      embed.addField(`Votes: ${reaction.count - 1}`, `${reaction.emoji} ${answer}`, false);
    });
    return embed;
  }

  private _sortByCount(a: IReactionAnswer, b: IReactionAnswer) {
    const reactA = a.reaction;
    const reactB = b.reaction;
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

interface IReactionCount {
  count: number;
  emoji: string;
}

interface IReactionAnswer {
  reaction: IReactionCount;
  answer: string;
}
