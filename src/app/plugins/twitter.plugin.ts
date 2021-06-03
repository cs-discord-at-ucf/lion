import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { TwitterTimelineResponse, TwitterService } from '../../services/twitter.service'

const accounts: Record<string, string> = {
    ucf: '18999501',
    knights: '21306514',
    football: '30282826',
    knighthacks: '3122136832',
    cecs: '2292877801',
}

const twitterIconURL = 'https://images-ext-1.discordapp.net/external/bXJWV2Y_F3XSra_kEqIYXAAsI3m1meckfLhYuWzxIfI/https/abs.twimg.com/icons/apple-touch-icon-192x192.png';

export class TwitterPlugin extends Plugin {

    // The twitter API returns a min of 5 tweets, but thats a bit much for our bot, so we'll do 3 instead.
    maxSize = 3;

    public get name(): string {
        return 'twitter'
    }
    public get description(): string {
        return 'Gets the latest twitter timelines from UCF accounts';
    }
    public get usage(): string {
        throw 'twitter <Account>';
    }

    public get permission(): ChannelType {
        return ChannelType.Public
    }

    private twitter = new TwitterService();

    public constructor(public container: IContainer) {
        super();
    }

    public async execute(message: IMessage, args: string[]) {
        const [param] = args;

        let accountId;

        // Default to UCF account if no args provided.
        if (args.length === 0) {
            accountId = accounts.ucf;
        } else {
            accountId = accounts[param.toLowerCase()];
        }

        // Show possible options if invalid account was specified.
        if (!accountId) {
            let options = '\n';
            Object.keys(accounts).forEach(key => options += `🔸 ${key}\n`);
            message.react('❌')
            message.reply(`Invalid UCF Twitter Account \'${param}\', possible options are:${options}`);
            return;
        }

        message.react('👍');
        message.reply('Sure thing! Getting latest tweets!');

        // Fetch respective tweets.
        const response = await this.twitter.getLatestTweets(accountId, this.maxSize);
        const embeds = await this._createEmbedList(response, accountId);

        // Send out all of the fetched tweets.
        embeds.forEach(embed => message.reply(embed));
    }

    private async _createEmbedList(tweets: TwitterTimelineResponse, id: string): Promise<MessageEmbed[]> {
        const user = await this.twitter.getUser(id);

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
            embed.setFooter('Twitter', twitterIconURL);

            // Fetch the attachment from the given key, and load it into
            // the embed.
            if (tweet.attachments && tweets.includes?.media) {
                tweet.attachments.media_keys.forEach(key => {
                    // Lookup media key in response map
                    const imgURL = tweets.includes?.media?.find(imageKey => imageKey.media_key === key)?.url;
                    if (imgURL) {
                        embed.setImage(imgURL)
                    }
                })
            }
            return embed;
        });
    }
}