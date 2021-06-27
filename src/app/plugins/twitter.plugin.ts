import { MessageEmbed, TextChannel, Webhook } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { TwitterTimelineResponse, TwitterService } from '../../services/twitter.service';

export default class TwitterPlugin extends Plugin {
  public commandName: string = 'twitter';
  public name = 'twitter';
  public description = 'Gets the latest twitter timelines from UCF accounts';
  public permission = ChannelType.Public;
  public usage = 'twitter <UCF account>';

  private static _twitterIconURL = 'https://images-ext-1.discordapp.net/external/bXJWV2Y_F3XSra_kEqIYXAAsI3m1meckfLhYuWzxIfI/https/abs.twimg.com/icons/apple-touch-icon-192x192.png';
  private static _accounts: Record<string, string> = {
    ucf: '18999501',
    knights: '21306514',
    football: '30282826',
    knighthacks: '3122136832',
    cecs: '2292877801',
  };

  // The reason a webhook is used here is because traditional bot messages don't allow you
  // to send multiple embeds at once, with a webhook you can send 10 at a time.

  private _webhook!: Webhook;

  // The twitter API returns a min of 5 tweets, but thats a bit much for our bot, so we'll do 3 instead.
  private _maxSize = 3;
  private _twitter = new TwitterService();
    
  public constructor(public container: IContainer) {
    super();
    this._twitter = container.twitterService;
  }

  public async execute(message: IMessage, args: string[]) {
    const [param] = args;

    // Default to UCF account if no args provided.
    const accountId = param ? TwitterPlugin._accounts[param.toLowerCase()] : TwitterPlugin._accounts.ucf;

    // Show possible options if invalid account was specified.
    if (!accountId) {
      let options = '\n';
      Object.keys(TwitterPlugin._accounts).forEach(key => options += `🔸 ${key}\n`);
      await Promise.all([
        message.react('❌'),
        message.reply(`Invalid UCF Twitter Account \'${param}\', possible options are:${options}`)
      ]);
      return;
    }

    await Promise.all([message.react('👍'), message.reply('Sure thing! Getting latest tweets!')]);

    // Fetch respective tweets.
    const response = await this._twitter.getLatestTweets(accountId, this._maxSize);
    const embeds = await this._createEmbeds(response, accountId);

    // Lazy-load webhook
    if (!this._webhook || this._webhook.channelID !== message.channel.id) {
      this._webhook = await this._resolveWebhook(message.channel as TextChannel);
    }

    this._webhook.send({ embeds });
  }

  private async _createEmbeds(tweets: TwitterTimelineResponse, id: string): Promise<MessageEmbed[]> {
    const user = await this._twitter.getUser(id);

    return tweets.data.map(tweet => {
      const embed = new MessageEmbed();

      // Set embed properties.
      embed.setDescription(tweet.text);
      embed.setColor('#2b99ff');
      embed.setAuthor(`${user.name} (${user.username})`, user.profile_image_url, `https://twitter.com/${user.username}`);
      embed.addField('Likes', tweet.public_metrics.like_count, true);
      embed.addField('Retweets', tweet.public_metrics.retweet_count, true);
      embed.addField('Replies', tweet.public_metrics.reply_count, true);
      embed.setTimestamp(new Date(tweet.created_at));
      embed.setFooter('Twitter', TwitterPlugin._twitterIconURL);

      // Fetch the attachment from the given key, and load it into
      // the embed.
      if (tweet.attachments && tweets.includes?.media) {
        tweet.attachments.media_keys.forEach(key => {
          // Lookup media key in response map
          const imgURL = tweets.includes?.media?.find(imageKey => imageKey.media_key === key)?.url;
          if (imgURL) {
            embed.setImage(imgURL);
          }
        });
      }
      return embed;
    });
  }

  private async _resolveWebhook(channel: TextChannel) {
    // Check if the webhook already exists
    const webhook = (await channel.fetchWebhooks()).find((webhook) => webhook.name === 'UCF Twitter');
    if (webhook) { return webhook; }

    // Otherwise create a new webhook
    const newHook = await channel.createWebhook('UCF Twitter', {
      avatar: 'https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg'
    });

    return newHook;
  }
}
