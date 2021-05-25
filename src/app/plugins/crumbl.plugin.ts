// Original bot code: https://github.com/rob-3/crumblbot

import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { IContainer, IHttpResponse, IMessage, ChannelType, Maybe } from '../../common/types';
import { MessageEmbed } from 'discord.js';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';

export class CrumblPlugin extends Plugin {
  public name: string = 'Crumbl Cookies Plugin';
  public description: string = 'Returns the cookies available that week at Crumbl';
  public usage: string = 'crumbl';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Food;
  public buildId: string = '';
  private _lastPost: Maybe<IMessage> = null;
  
  constructor(public container: IContainer) {
    super();
  }

  public _matchId (data: string, regex: RegExp): string
  {
    const matches = data.match(regex);

    if (matches !== null && matches.length > 1)
    {
      return matches[1];
    }
    
    return '';
  }

  private _createEmbed(cookies: any, message: IMessage): MessageEmbed[]
  {
    return  cookies
      .filter (
        (c: any) => c.name !== 'Milk Chocolate Chip' && c.name !== 'Chilled Sugar'
      )
      .map((cookie: any, i: number) => {
          const embed = new MessageEmbed()
          .setTitle(cookie.name)
          .setDescription(cookie.description)
          .setThumbnail(cookie.image);
          return embed;
        });
  }

  public async execute(message: IMessage, args: string[]) {
    const regex: RegExp = /"buildId":"(.*?)"/;

    await this.container.httpService
      .get('https://crumblcookies.com')
      .then((response: IHttpResponse) => {
        
        const data: string = response.data;
        this.buildId = this._matchId(data, regex); 
      })
      .catch((err) => this.container.loggerService.warn(err));      

    await this.container.httpService
      .get(`https://crumblcookies.com/_next/data/${this.buildId}/index.json`)
        .then(async (blob: IHttpResponse) => {
          if (this.buildId === '')
          {
            console.log('The build id is empty');
            return;
          }

          const cookies = blob.data.pageProps.products.cookies;
          const pages: MessageEmbed[] =  this._createEmbed(cookies, message);
          await this.container.messageService
            .sendPagedEmbed(message, pages)
            .then(async (sentMsg) => await this._deleteOldPost(message, sentMsg))
            .catch((err: any) => this.container.loggerService.warn(err));
      })
      .catch((err) => this.container.loggerService.warn(err));  
  }

  private async _deleteOldPost(listCall: IMessage, newPosting: IMessage) {
    //.get To make sure the message wasnt deleted already
    if (this._lastPost && listCall.channel.messages.cache.get(this._lastPost.id)) {
      await this._lastPost.delete();
      this._lastPost = newPosting;
      return;
    }

    await this._fetchMessages(listCall, 100).then((messages) => {
      const botMsgs = messages.filter(
        (msg) =>
          msg.author.bot && //From bot
          msg.embeds.length && //Contains an embed
          newPosting.id != msg.id //Not the new listing
      );
      if (botMsgs.length === 0) {
        return;
      }

      this._lastPost = botMsgs[0];
    });

    //It's possible to have not posted a list in the last 100 messages
    if (!this._lastPost) {
      this._lastPost = newPosting;
      return;
    }

    await this._lastPost.delete();
    this._lastPost = newPosting;
  }

  private async _fetchMessages(message: IMessage, limitParam: number) {
    let i: number;
    let last_id = message.id;
    const buffer: IMessage[] = [];

    for (i = 0; i < limitParam / 100; i++) {
      const config = { limit: 100, before: last_id };
      const batch = await message.channel.messages.fetch(config);
      //Make sure there are messages
      if (!batch.size) {
        continue;
      }

      const last = batch.last();
      if (last) {
        last_id = last.id;
      }

      buffer.push(...batch.array());
    }
    return buffer;
  }
}
