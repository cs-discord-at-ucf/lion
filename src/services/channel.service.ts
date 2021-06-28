import Constants from '../common/constants';
import { ChannelType, IChannelCategory } from '../common/types';

export class ChannelService {
  private _channels = new Map<ChannelType, string[]>();
  private _channelCategories: ChannelType[] = [
    ChannelType.Public,
    ChannelType.Staff,
    ChannelType.Admin,
    ChannelType.Bot,
    ChannelType.All,
  ];

  constructor() {
    this.channelCategories.forEach((type: ChannelType) => {
      // If the type is all, get all the channels
      const category: IChannelCategory =
        type === ChannelType.All
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
    return ChannelType.Private;
  }

  hasPermission(channel: string, minimumChannelPermission: ChannelType) {
    if (minimumChannelPermission === ChannelType.All) {
      return true;
    }

    const channelType = this.getChannelType(channel);

    if (minimumChannelPermission === ChannelType.Public) {
      return (
        channelType === ChannelType.Public ||
        channelType === ChannelType.Staff ||
        channelType === ChannelType.Admin
      );
    } else if (minimumChannelPermission === ChannelType.Staff) {
      return channelType === ChannelType.Staff || channelType === ChannelType.Admin;
    } else if (minimumChannelPermission === ChannelType.Admin) {
      return channelType === ChannelType.Admin;
    } else if (minimumChannelPermission === ChannelType.Bot) {
      return channelType === ChannelType.Bot;
    }
    return channelType === ChannelType.Private;
  }

  public get channelCategories() {
    return [...this._channelCategories];
  }
}
