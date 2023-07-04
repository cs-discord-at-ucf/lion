import Constants from '../common/constants';
import { ChannelGroup, IChannelCategory } from '../common/types';

export class ChannelService {
  private _channels = new Map<ChannelGroup, string[]>();
  private _channelCategories: ChannelGroup[] = [
    ChannelGroup.Public,
    ChannelGroup.Staff,
    ChannelGroup.Admin,
    ChannelGroup.Bot,
    ChannelGroup.All,
  ];

  constructor() {
    this.channelCategories.forEach((type: ChannelGroup) => {
      // If the type is all, get all the channels
      const category: IChannelCategory =
        type === ChannelGroup.All
          ? Object.values(Constants.Channels).flatMap((el) => Object.values(el))
          : Constants.Channels[type];
      const channels: string[] = [];

      Object.keys(category).forEach((channelName: string) => {
        channels.push(category[channelName]);
      });

      this._channels.set(type, channels);
    });
  }

  getChannelType(channel: string) {
    const categories = this.channelCategories;

    for (const category of categories) {
      const channels = this._channels.get(category) ?? [];
      for (const channelName of channels) {
        if (channel === channelName) {
          return category;
        }
      }
    }

    // If we somehow end up here, let's just assume that this is a private channel.
    return ChannelGroup.Private;
  }

  hasPermission(channel: string, minimumChannelPermission: ChannelGroup) {
    if (minimumChannelPermission === ChannelGroup.All) {
      return true;
    }

    const channelType = this.getChannelType(channel);

    if (minimumChannelPermission === ChannelGroup.Public) {
      return (
        channelType === ChannelGroup.Public ||
        channelType === ChannelGroup.Staff ||
        channelType === ChannelGroup.Admin
      );
    }
    if (minimumChannelPermission === ChannelGroup.Staff) {
      return channelType === ChannelGroup.Staff || channelType === ChannelGroup.Admin;
    }
    if (minimumChannelPermission === ChannelGroup.Admin) {
      return channelType === ChannelGroup.Admin;
    }
    if (minimumChannelPermission === ChannelGroup.Bot) {
      return channelType === ChannelGroup.Bot;
    }
    return channelType === ChannelGroup.Private;
  }

  public get channelCategories() {
    return [...this._channelCategories];
  }
}
