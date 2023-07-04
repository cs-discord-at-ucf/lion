import { EmbedBuilder } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelGroup, IContainer, ICountingEntry, IMessage } from '../../common/types';
import { CountingLeaderboardModel } from '../../schemas/games.schema';

export default class CountingLeaderboardPlugin extends Plugin {
  public commandName = 'countingLeaderboard';
  public name = 'Counting Leaderboard';
  public description = 'Displays the top posters in #counting';
  public usage = 'countlb';
  public override pluginAlias = ['countlb'];
  public permission = ChannelGroup.All;
  public override pluginChannelName = Constants.Channels.Public.Games;

  private readonly _DISPLAY_AMOUNT = 15;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    const docs = (
      await CountingLeaderboardModel.find({ guildId: this.container.guildService.get().id })
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, this._DISPLAY_AMOUNT);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(this.name)
          .addFields({
            name: 'Leaderboard',
            value: (
              await Promise.all(
                docs.map(
                  async (userDoc: ICountingEntry, i: number) =>
                    `${i + 1}. ${await this._convertICountingEntryToString(userDoc)}`
                )
              )
            ).join('\n'),
          })
          .setTimestamp(Date.now()),
      ],
    });
  }

  private _convertICountingEntryToString = async (userPoints: ICountingEntry) => {
    const user = await this.container.clientService.users.fetch(userPoints.userId);
    return `${user ?? userPoints.userId}: ${userPoints.count}`;
  };
}
