import { IContainer } from '../../common/types';
import { Job } from '../../common/job';
import { TextChannel } from 'discord.js';

export class UserRecordJob extends Job {
  public interval: number = 1000 * 60 * 5; // 5 minutes
  public name: string = 'user_record';
  private _announcementChannel: { name: string; channel: TextChannel | null } = {
    name: 'general',
    channel: null,
  };

  constructor() {
    super();
  }

  async getGlobalMax(container: IContainer) {
    try {
      const userRecords = (await container.storageService.getCollections()).userrecords?.find();
      if (!userRecords?.hasNext()) {
        return -Infinity;
      }
      return ((await userRecords.next()) || {}).count;
    } catch (e) {
      container.loggerService.error(e);
    }
  }

  public async execute(container: IContainer) {
    if (!this._announcementChannel.channel) {
      const needle = container.guildService
        .get()
        .channels.array()
        .find((c) => c.name === this._announcementChannel.name);
      if (!needle) {
        return;
      }
      this._announcementChannel.channel = container.clientService.channels.get(
        needle.id
      ) as TextChannel;
    }

    const cachedCount = (await this.getGlobalMax(container)) || -Infinity;
    const currentCount = container.guildService
      .get()
      .members.array()
      .filter((member) => member.presence.status !== 'offline').length;
    if (currentCount > cachedCount) {
      this._announcementChannel.channel.send(`
        **🎉🎉 New online user record 🎉🎉**
        ${currentCount}
        `);

      // Update mongo record with `currentCount`
    }
  }
}
