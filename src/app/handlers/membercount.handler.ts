import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IServerInfo } from '../../common/types';

export class MemberCountHandler implements IHandler {
  private _memberMilestoneInterval = 100;

  constructor(public container: IContainer) {}
  public async execute(member: GuildMember) {
    const collections = await this.container.storageService.getCollections();
    const { serverInfo: serverInfoCollection } = collections;
    const knightEmoji = member.guild.emojis.cache.find((e) => e.name === 'knight');

    if (!serverInfoCollection) {
      return;
    }

    const res = await serverInfoCollection
      .find<IServerCount>({ name: 'MemberCount' })
      .toArray();

    const lastSavedMemberCount = res[res.length - 1].count;

    if (!res.length) {
      return;
    }

    const currentCount = member.guild.memberCount;

    // we didnt reach a milestone
    if (lastSavedMemberCount + this._memberMilestoneInterval < currentCount) {
      return;
    }

    const announcementChannel = this.container.guildService.getChannel(
      Constants.Channels.Info.Announcements
    ) as TextChannel;

    const embed = new MessageEmbed();

    embed.setTitle('🎊 Server Member Milestone! 🎊');
    embed.setDescription(
      `We just hit ${currentCount} members! Go Knights! ${knightEmoji}\n` +
        `[Invite your friends](https://discord.gg/uXBmTd9) to help us reach the next milestone.`
    );

    await announcementChannel.send(embed);

    const memberDoc: IServerCount = {
      name: 'MemberCount',
      count: currentCount,
      dateUpdated: new Date(),
    };

    await serverInfoCollection.insertOne(memberDoc);
  }
}

export interface IServerCount extends IServerInfo {
  count: number;
  dateUpdated: Date;
}
