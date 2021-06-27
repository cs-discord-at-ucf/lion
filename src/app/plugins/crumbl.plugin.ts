// Original bot code: https://github.com/rob-3/crumblbot

import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IHttpResponse, IMessage, ChannelType, Maybe } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export default class CrumblPlugin extends Plugin {
  public commandName: string = 'crumbl';
  public name: string = 'Crumbl Cookies Plugin';
  public description: string = 'Returns the cookies available that week at Crumbl';
  public usage: string = 'crumbl';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Food;

  private _buildId: string = '';
  private _lastPost: Maybe<IMessage> = null;
  private _regex: RegExp = /"buildId":"(.*?)"/;

  constructor(public container: IContainer) {
    super();
  }

  // buildId string is the first element, actual buildId is the second.
  public matchId(data: string): string {
    const matches = data.match(this._regex);
    if (!matches) {
      return '';
    }

    const [, id] = matches;
    return id;
  }

  private _createEmbed(cookies: ICookie[]): MessageEmbed[] {
    // Flavors of the week, no point in including the staples.
    return cookies
      .filter((c: ICookie) => c.name !== 'Milk Chocolate Chip' && c.name !== 'Chilled Sugar')
      .map((cookie: ICookie) =>
        new MessageEmbed()
          .setTitle(cookie.name)
          .setDescription(cookie.description)
          .setThumbnail(cookie.image)
      );
  }

  public async execute(message: IMessage) {
    await this.container.httpService
      .get('https://crumblcookies.com')
      .then((response: IHttpResponse) => {
        const data: string = response.data;
        this._buildId = this.matchId(data);
      })
      .catch((err) => this.container.loggerService.warn(err));

    await this.container.httpService
      .get(`https://crumblcookies.com/_next/data/${this._buildId}/index.json`)
      .then(async (blob: IHttpResponse) => {
        if (this._buildId === '') {
          this.container.loggerService.warn('The build id is empty');
          await message.reply('We could not retrieve the cookies at this time :(.');
          return;
        }

        const cookies = blob.data.pageProps.products.cookies;
        const pages: MessageEmbed[] = this._createEmbed(cookies);
        await this.container.messageService
          .sendPagedEmbed(message, pages)
          .then(async (sentMsg) => await this._deleteOldPost(message, sentMsg))
          .catch((err) => this.container.loggerService.warn(err));
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  private async _deleteOldPost(listCall: IMessage, newPosting: IMessage) {
    // .get To make sure the message wasnt deleted already
    if (this._lastPost && listCall.channel.messages.cache.get(this._lastPost.id)) {
      await this._lastPost.delete();
      this._lastPost = newPosting;
      return;
    }

    const messages = await listCall.channel.messages.fetch({ limit: 100 });
    const botMsgs = messages.filter(
      (msg) =>
        msg.author.bot && // From bot
        msg.embeds.length !== 0 && // Contains an embed
        newPosting.id !== msg.id // Not the new listing
    );

    if (!botMsgs.size) {
      return;
    }

    this._lastPost = botMsgs.first();

    // It's possible to have not posted a list in the last 100 messages
    if (!this._lastPost) {
      this._lastPost = newPosting;
      return;
    }

    await this._lastPost.delete();
    this._lastPost = newPosting;
  }
}

export interface ICookie {
  id: string;
  name: string;
  image: string;
  newImage: string;
  description: string;
  servingMethod: string;
  iconImage?: string | null;
  orientation: string;
}
