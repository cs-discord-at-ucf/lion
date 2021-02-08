import { IContainer } from '../../common/types';
import { Job } from '../../common/job';

export class InactiveVoiceJob extends Job {
  public interval: number = 1000 * 60 * 10; // Every 10 mintues
  public name: string = 'Inactive Voice';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    const vcs = container.classService.getVoiceChannels();

    for (const vcObj of vcs) {
      const [name, vc] = vcObj;

      const newUsers = vc.voiceChan.members.size;
      if (newUsers === vc.lastUsers && vc.lastUsers === 0) {
        await container.classService
          .deleteVoiceChan(name)
          .then(
            async () =>
              await vc.classChan.send(
                '**Voice channel for this class was removed for being inactive.**'
              )
          );
      } else {
        vc.lastUsers = newUsers;
        container.classService.udpateClassVoice(name, vc);
      }
    }
  }
}
