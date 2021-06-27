import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IServerInfo } from '../../common/types';
import mongoose from 'mongoose';
import { ServerInfoModel } from '../../schemas/server.schema';

export class MemberCountHandler implements IHandler {
  private _MILESTONE_INTERVAL: number = 100;

  constructor(public container: IContainer) {}
  public async execute(member: GuildMember) {
    const knightEmoji = member.guild.emojis.cache.find((e) => e.name === 'knight');

    if (!mongoose.connection.readyState) {
      return;
    }

    const currentCount = member.guild.memberCount;

    const memberCountDocs = (await ServerInfoModel
      .find({ name: 'MemberCount' })) as unknown as IServerCount[];

    const countToInsert: IServerCount = {
      name: 'MemberCount',
      count: currentCount,
      dateUpdated: new Date(),
    };

    if (!memberCountDocs.length) {
      // we want to add the initial count on a nice number
      if (currentCount % this._MILESTONE_INTERVAL !== 0) {
        return;
      }

      await ServerInfoModel.create(countToInsert);
      return;
    }

    const lastSavedMemberCount = memberCountDocs[memberCountDocs.length - 1].count;

    // we didnt reach a milestone
    if (lastSavedMemberCount + this._MILESTONE_INTERVAL < currentCount) {
      return;
    }

    const announcementChannel = this.container.guildService.getChannel(
      Constants.Channels.Info.Announcements
    ) as TextChannel;

    const embed = new MessageEmbed();

    embed.setTitle('🎊 Server Member Milestone! 🎊');
    embed.setDescription(
      `We just hit ${currentCount} members! Go Knights! ${knightEmoji}\n` +
        '[Invite your friends](https://discord.gg/uXBmTd9) to help us reach the next milestone.'
    );

    await announcementChannel.send(embed);

    await ServerInfoModel.create(countToInsert);
  }
}

export interface IServerCount extends IServerInfo {
  count: number;
  dateUpdated: Date;
}
