import { Client, Guild, VoiceChannel } from 'discord.js';
import { ClientService } from './client.service';
import { GuildService } from './guild.service';
import * as ytdl from 'ytdl-core';
import * as ytSearch from 'yt-search';
import { IMessage, Maybe } from '../common/types';

export class MusicService {
  private _guild: Guild;
  private _client: Client;
  constructor(private _clientService: ClientService, private _guildService: GuildService) {
    this._client = this._clientService;
    this._guild = this._guildService.get();
  }

  public async play(targetVoiceChan: VoiceChannel, songName: string): Promise<string> {
    //Should make sure the bot isnt occupied
    const connection = await targetVoiceChan.join();

    const video = await this._videoFinder(songName);
    if (!video) {
      return 'Could not play video';
    }

    const stream = ytdl.default(video.url, { filter: 'audioonly' });
    connection.play(stream, { seek: 0, volume: 1 }).on('finish', () => targetVoiceChan.leave());

    return `Now playing ${video.title}`;
  }

  private async _videoFinder(query: string): Promise<Maybe<ytSearch.VideoSearchResult>> {
    const videoResult = await ytSearch.search(query);
    if (!videoResult.videos.length) {
      return null;
    }

    return videoResult.videos[0];
  }

  public getUserVoiceChannel(message: IMessage): Maybe<VoiceChannel> {
    const member = this._guild.members.cache.get(message.author.id);
    if (!member) {
      return null;
    }

    return member.voice.channel;
  }
}
