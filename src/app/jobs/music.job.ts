import { IContainer } from '../../common/types';
import { Job } from '../../common/job';

export class MusicJob extends Job {
  public interval: number = 1000 * 60 * 5; //Every 5 minute
  public name: string = 'Music';

  private _wasSilent = false;

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    if (!container.musicService.isInVC()) {
      return;
    }

    console.log('Checking if AFK');
    const isSilent = container.musicService.isStreaming();
    console.log(isSilent);

    if (isSilent && this._wasSilent) {
      container.musicService.leaveVC();
      return;
    }

    this._wasSilent = isSilent;
  }
}
