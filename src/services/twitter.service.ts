import axios, { AxiosRequestConfig } from 'axios';

export type Tweet = {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  attachments?: {
    media_keys: string[];
  };
  public_metrics: TwitterPublicMetrics;
};

export type TwitterPublicMetrics = {
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
};

export type TwitterUser = {
  username: string,
  profile_image_url: string,
  id: string,
  name: string,
};

type TwitterMedia = {
  type?: 'photo' | 'animated_gif';
  media_key?: string;
  preview_image_url?: string;
  url?: string;
};

export type TwitterUserResponse = {
  data: TwitterUser
};

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
};

export class TwitterService {
  private _bearerToken = process.env.TWITTER_BEARER_TOKEN;
  private _http = axios.create();

  public constructor() {
    // Hook the requests with the bearer token
    this._http.interceptors.request.use((config): AxiosRequestConfig => {
      config.headers = {
        Authorization: `Bearer ${this._bearerToken}` 
      };
      return config;
    });
  }

  /**
   * Gets the latest tweets from the given user.
   * 
   * @param id The ID of the user to get the tweets from.
   * @param max The max amount of tweets to return. (A number between 0 and 100)
   * @returns Twitter Response
   */
  public async getLatestTweets(id: string, max: number = 5): Promise<TwitterTimelineResponse> {

    // The twitter API is quite conservative when it comes to returning data. You'll need to 
    // tell the API explicity the fields you want access to, hence these params.
    const config = {
      params: {
        expansions: 'attachments.media_keys,referenced_tweets.id,author_id',
        'media.fields': 'duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width',
        'tweet.fields': 'created_at,public_metrics',
        'max_results': `${max < 5 ? 5 : max}`
      }
    };

    const response = await this._http
      .get<TwitterTimelineResponse>(`https://api.twitter.com/2/users/${id}/tweets`, config);

    // The twitter API returns a minimum of 5 tweets so, if 
    // less is requested, then splice the data out.
    const { data } = response.data;
    if (max < data.length) {
      response.data.data = data.slice(0, max);
    }
    
    return response.data;
  }

  /**
   * Gets the details of the given twitter user.
   * 
   * @param id The ID of the user to fetch
   * @returns The twitter user's info
   */
  public async getUser(id: string): Promise<TwitterUser> {

    const config = {
      params: {
        'user.fields': 'profile_image_url',
      }
    };

    const response = await this._http
      .get<TwitterUserResponse>(`https://api.twitter.com/2/users/${id}`, config);
    return response.data.data;
  }
}
