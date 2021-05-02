import { Guild, MessageEmbed, VoiceChannel, VoiceConnection } from 'discord.js';
import { ClientService } from './client.service';
import { GuildService } from './guild.service';
import * as ytdl from 'ytdl-core';
import * as ytSearch from 'yt-search';
import { IMessage, Maybe } from '../common/types';
import { MemberUtils } from '../app/util/member.util';

export class MusicService {
  private _queue: ytSearch.VideoSearchResult[] = [];
  private _connection: Maybe<VoiceConnection> = null;
  private _client: ClientService;
  private _guild: Guild;

  constructor(private _clientService: ClientService, private _guildService: GuildService) {
    this._client = this._clientService;
    this._guild = this._guildService.get();
  }

  public async queue(message: IMessage, songName: string): Promise<string> {
    if (!message.member) {
      return 'Could not resolve to user';
    }

    const isModerator = MemberUtils.hasRole(message.member, 'moderator');
    if (!isModerator) {
      return 'You must be a moderator to use this plugin';
    }

    //Should make sure the bot isnt occupied
    const targetVC = message.member.voice.channel;
    if (!targetVC) {
      return 'You must be in a voice channel to use this plugin';
    }

    const video = await this._videoFinder(songName);
    if (!video) {
      return 'Could not play video';
    }

    this._queue.push(video);
    if (!this._connection) {
      this._play(targetVC);
    }

    return `Added: **${video.title}** to queue`;
  }

  private async _play(vc: VoiceChannel) {
    if (!this._queue.length) {
      return;
    }

    const video = this._queue.shift();
    if (!video) {
      return;
    }

    const stream = ytdl.default(video.url, { filter: 'audioonly' });
    this._connection = await vc.join();
    this._connection.play(stream, { seek: 0, volume: 1 }).on('finish', () => {
      if (!this._queue.length) {
        vc.leave();
        this._connection = null;
        return;
      }

      this._play(vc);
    });
  }

  public getQueue() {
    const embed = new MessageEmbed();
    embed.setTitle(`${this._queue.length} Songs in Queue`);
    embed.addField(
      'Tracks',
      this._queue.map((song) => song.title).join('\n') || 'No Songs Currently in Queue'
    );
    return embed;
  }

  private async _videoFinder(query: string): Promise<Maybe<ytSearch.VideoSearchResult>> {
    const videoResult = await ytSearch.search(query);
    if (!videoResult.videos.length) {
      return null;
    }

    return videoResult.videos[0];
  }
}
