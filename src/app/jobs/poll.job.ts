import { IContainer } from '../../common/types';
import { Job } from '../../common/job';

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
      console.log(timeActive);

      //Minutes * 60 to get seconds
      if (timeActive > poll.expiry * 60) {
        container.messageService.deletePoll(poll);
      }
    });
  }
}
