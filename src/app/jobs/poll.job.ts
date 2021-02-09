import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import { MessageEmbed } from 'discord.js';
import { Poll } from '../plugins/poll.plugin';
import Constants from '../../common/constants';

export class PollJob extends Job {
  public interval: number = 1000 * 60 * 1; //Every minute
  public name: string = 'Poll';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    const polls = container.messageService.getPolls();
    polls.forEach((poll) => {
      const timeActive = (Date.now() - poll.start.getTime()) / 1000; //Ms to sec
      //Minutes * 60 to get seconds
      if (timeActive >= poll.expiry * 60) {
        const embed = this.createEmbed(poll);
        poll.msg.channel.send(embed);
        container.messageService.deletePoll(poll);
      }
    });
  }

  private createEmbed(poll: Poll): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(`Poll has concluded!`);
    embed.setThumbnail(Constants.PollThumbnail);

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
    return reactA.count < reactB.count ? 1 : -1;
  }
}
