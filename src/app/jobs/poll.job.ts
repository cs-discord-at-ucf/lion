import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import { Poll } from '../../services/poll.service';

export class PollJob extends Job {
  public interval: number = 1000 * 60 * 1; // Every minute
  public name: string = 'Poll';

  constructor() {
    super();
  }

  public execute(container: IContainer) {
    const polls: Map<number, Poll> = container.pollService.getPolls();
    const now = new Date().getTime();

    Array.from(polls.values())
      .filter((p) => now >= p.expiry.getTime())
      .forEach(async (poll) => {
        const embed = container.pollService.createResultEmbed(poll);

        await poll.msg.channel.send(embed).then(() => {
          container.pollService.deletePoll(poll);
        });
      });
  }
}
