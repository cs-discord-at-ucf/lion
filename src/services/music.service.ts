import {
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  MessageEmbed,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import { ClientService } from './client.service';
import { GuildService } from './guild.service';
import * as ytdl from 'ytdl-core';
import * as ytSearch from 'yt-search';
import { IMessage, Maybe } from '../common/types';
import { MemberUtils } from '../app/util/member.util';

export class MusicService {
  private _queue: ytSearch.VideoSearchResult[] = [];
  private _connection: Maybe<VoiceConnection> = null;
  private _currentVoiceChannel: Maybe<VoiceChannel> = null;

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

    const botChan = this._guildService.getChannel('bot_commands') as TextChannel;
    await botChan.send(this._videoToEmbed(video));

    this._currentVoiceChannel = vc;
    const stream = ytdl.default(video.url, { filter: 'audioonly' });
    this._connection = await vc.join();
    this._connection.play(stream, { seek: 0, volume: 1 }).on('finish', () => {
      if (!this._queue.length) {
        this._connection = null;
        this._currentVoiceChannel = null;
        return;
      }

      this._play(vc);
    });
  }

  private _videoToEmbed(video: ytSearch.VideoSearchResult): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle('Now Playing');
    embed.addField('Track', video.title, false);
    embed.addField('Artist', video.author.name, false);
    embed.addField('Length', video.duration, false);
    return embed;
  }

  public skip(): Maybe<string> {
    if (!this._connection) {
      return 'Nothing to skip';
    }

    if (!this._currentVoiceChannel) {
      return `I'm not currently in a voice channel.`;
    }

    //If there is nothing else to play, end the connection
    if (!this._queue.length) {
      this._connection.disconnect();
      return;
    }

    //Play next song
    this._play(this._currentVoiceChannel);
    return null;
  }

  public listQueue() {
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

  public isStreaming(): boolean {
    return !Boolean(this._connection);
  }

  public isInVC(): boolean {
    return Boolean(this._currentVoiceChannel);
  }

  public leaveVC(): void {
    if (!this._currentVoiceChannel) {
      return;
    }

    this._currentVoiceChannel.leave();
  }
}
