import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { Tweet, TwitterTimelineResponse, TwitterService } from '../../services/twitter.service'

namespace TwitterMeta {
    export const accounts = new Map<string, string>();
    accounts.set('UCF', '18999501');
}



export class TwitterPlugin extends Plugin {

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
        return tweets.data.map((tweet) => {
            const embed = new MessageEmbed();

            embed.setDescription(tweet.text);
            embed.setColor('#2b99ff');
            embed.setAuthor('@UCF', user.profile_image_url)

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