import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { TwitterTimelineResponse, TwitterService } from '../../services/twitter.service'

namespace TwitterMeta {
    export const accounts = new Map<string, string>();
    accounts.set('UCF', '18999501');
}



export class TwitterPlugin extends Plugin {

    maxSize = 3;

    public get name(): string {
        return 'twitter'
    }
    public get description(): string {
        return 'Gets the latest twitter timelines from UCF accounts';
    }
    public get usage(): string {
        throw 'twitter';
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

        const accountId = TwitterMeta.accounts.get(param);

        const response = await this.twitter.getLatestTweets(accountId!);
        console.log(response);
        const embeds = await this._createEmbedList(response);

        embeds.forEach(embed => message.reply(embed))
    }

    private async _createEmbedList(tweets: TwitterTimelineResponse): Promise<MessageEmbed[]> {
        const user = await this.twitter.getUser('18999501');
        return tweets.data.map((tweet, index) => {
            const embed = new MessageEmbed();

            embed.setDescription(tweet.text);
            embed.setColor('#2b99ff');
            embed.setAuthor(`${user.name} (${user.username})`, user.profile_image_url, `https://twitter.com/${user.username}`)
            embed.addField('Likes', tweet.public_metrics.like_count, true)
            embed.addField('Retweets', tweet.public_metrics.retweet_count, true)
            embed.addField('Replies', tweet.public_metrics.reply_count, true)
            embed.setTimestamp(new Date(tweet.created_at))
            embed.setFooter('Twitter', 'https://images-ext-1.discordapp.net/external/bXJWV2Y_F3XSra_kEqIYXAAsI3m1meckfLhYuWzxIfI/https/abs.twimg.com/icons/apple-touch-icon-192x192.png')

            console.log(user.profile_image_url)


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