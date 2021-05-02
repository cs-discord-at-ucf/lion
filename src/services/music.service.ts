import { MessageEmbed, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { GuildService } from './guild.service';
import * as ytdl from 'ytdl-core';
import * as ytSearch from 'yt-search';
import { IMessage, Maybe } from '../common/types';
import { MemberUtils } from '../app/util/member.util';
import * as moment from 'moment';

export class MusicService {
  private _queue: ytSearch.VideoSearchResult[] = [];
  private _connection: Maybe<VoiceConnection> = null;
  private _currentVoiceChannel: Maybe<VoiceChannel> = null;

  constructor(private _guildService: GuildService) {}

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

    if (this._currentVoiceChannel && targetVC.name !== this._currentVoiceChannel.name) {
      return 'I can only be used in one voice channel at a time';
    }

    const video = await this._videoFinder(songName);
    if (!video) {
      return 'Could not play video';
    }

    //Add to queue, and trigger play if not already playing
    this._queue.push(video);
    if (!this._connection) {
      this._play(targetVC);
    }

    return `Added: **${video.title}** to queue`;
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

  private async _play(vc: VoiceChannel): Promise<void> {
    if (!this._queue.length) {
      return;
    }

    const video = this._queue.shift();
    if (!video) {
      return;
    }

    //Send message in bot_commands what song is starting
    const botChan = this._guildService.getChannel('bot_commands') as TextChannel;
    await botChan.send(this._videoToEmbed(video));

    this._connection = await vc.join();
    this._currentVoiceChannel = vc;

    //Get Audio Stream
    const stream = ytdl.default(video.url, { filter: 'audioonly', highWaterMark: 1 << 25 });

    //Put play audio stream
    this._connection.play(stream, { seek: 0, volume: 1 }).on('finish', () => {
      //If there are no more songs to play, set connection to null
      //So the job can see its AFK
      if (!this._queue.length) {
        this._connection = null;
        this._currentVoiceChannel = null;
        return;
      }

      //Otherwise, play next song
      this._play(vc);
    });
  }

  private _getDurationOfQueue(): string {
    const seconds = this._queue.reduce((acc, cur) => acc + cur.seconds, 0);
    const duration = moment.duration(seconds, 'seconds');
    return `${duration.minutes()} minutes ${duration.seconds()} seconds`;
  }

  private async _videoFinder(query: string): Promise<Maybe<ytSearch.VideoSearchResult>> {
    const videoResult = await ytSearch.search(query);
    if (!videoResult.videos.length) {
      return null;
    }

    return videoResult.videos[0];
  }

  private _videoToEmbed(video: ytSearch.VideoSearchResult): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle('Now Playing');
    embed.setThumbnail(video.thumbnail);
    embed.setURL(video.url);
    embed.setColor('#1fe609');

    embed.addField('Track', video.title, false);
    embed.addField('Artist', video.author.name, false);
    embed.addField('Length', video.duration, false);
    return embed;
  }

  public listQueue(): MessageEmbed {
    const trackList = this._queue
      .map((song, i) => `**${i + 1}** - [${song.title}](${song.url})`)
      .join('\n');

    const embed = new MessageEmbed();
    embed.setTitle(`${this._queue.length} Songs in Queue`);
    embed.addField('Tracks', trackList || 'No Songs Currently in Queue');

    embed.setFooter(`Queue Duration: ${this._getDurationOfQueue()}`);
    return embed;
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
