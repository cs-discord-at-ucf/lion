import Environment from "../environment";
import { HttpService } from "./http.service";
import axios from 'axios';

export type Tweet = {
  id: string;
  text: string;
  author_id: string;
  attachments?: {
    media_keys: string[]
  }
}

export type TwitterUser = {
  username: string,
  profile_image_url: string,
  id: string,
  name: string,
}

type TwitterMedia = {
  type?: 'photo' | 'animated_gif';
  media_key?: string;
  preview_image_url?: string;
  url?: string;
}

export type TwitterUserResponse = {
  data: TwitterUser
}

export type TwitterTimelineResponse = {
  data: Tweet[];
  meta: {
      oldest_id: string;
      newest_id: string;
      result_count: number;
      nextToken: string;
  };
  includes?: {
    media?: TwitterMedia[]
  }
}

export class TwitterService {
  private bearerToken = Environment.TwitterBearerToken!;
  private config = {
    headers: {
      Authorization: `Bearer ${this.bearerToken}`,
    }
  }

  public async getLatestTweets(id: string): Promise<TwitterTimelineResponse> {
    const response = await axios.get<TwitterTimelineResponse>(`https://api.twitter.com/2/users/${id}/tweets?expansions=attachments.media_keys,referenced_tweets.id,author_id&media.fields=duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width`, this.config);
    return response.data;
  }

  public async getUser(id: string): Promise<TwitterUser> {
    const response = await axios.get<TwitterUserResponse>(`https://api.twitter.com/2/users/${id}?user.fields=profile_image_url`, this.config);
    return response.data.data;
  }
}