import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import { Poll } from '../../services/poll.service';
import ms from 'ms';

export class PollJob extends Job {
  public override interval: number = ms('2m');
  public override name: string = 'Poll';

  constructor() {
    super();
  }

  public override async execute(container: IContainer) {
    const polls: Map<number, Poll> = container.pollService.getPolls();
    const now = new Date().getTime();

    await Promise.all(
      Array.from(polls.values())
        .filter((p) => now >= p.expiry.getTime())
        .map(async (poll) => {
          const embed = container.pollService.createResultEmbed(poll);

          await poll.msg.channel.send({embeds:[embed]}).then(() => {
            container.pollService.deletePoll(poll);
          });
        })
    );
  }
}
