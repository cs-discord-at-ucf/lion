import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import ms from 'ms';

export class InactiveVoiceJob extends Job {
  public interval: number = ms('10m');
  public name: string = 'Inactive Voice';

  constructor() {
    super();
  }

  public async execute(container: IContainer) {
    const vcs = container.classService.getVoiceChannels();

    for (const vcObj of vcs) {
      const [name, vc] = vcObj;

      // Make sure channel wasnt deleted already
      if (vc.voiceChan.deleted) {
        await container.classService.deleteVoiceChan(name);
        continue;
      }

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
        container.classService.updateClassVoice(name, vc);
      }
    }
  }
}
