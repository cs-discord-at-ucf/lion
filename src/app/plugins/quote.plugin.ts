import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export default class QuotePlugin extends Plugin {
  public commandName: string = 'quote';
  public name: string = 'Quote Plugin';
  public description: string = 'Prints a random quote';
  public usage: string = 'quote <tag (optional)>';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;
  public override pluginChannelName: string = Constants.Channels.Public.General;

  private _DEFAULT_URL: string = 'https://api.quotable.io/random';
  private _VALID_TAGS: string[] = [
    'business',
    'education',
    'faith',
    'famous-quotes',
    'friendship',
    'future',
    'happiness',
    'history',
    'inspirational',
    'life',
    'literature',
    'love',
    'nature',
    'politics',
    'proverb',
    'religion',
    'science',
    'success',
    'technology',
    'wisdom',
  ];

  constructor(public container: IContainer) {
    super();
  }

  private _createEmbed(content: string, author: string, tag: string) {
    return new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(tag === 'Famous-quotes' ? 'Famous-Quotes' : tag)
      .setFooter('Pulled from api.quotable.io')
      .setTimestamp(new Date())
      .setDescription(
        `${content}

        - ${author}`
      );
  }

  private _capitalizeTag(tag: string) {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  public async execute(message: IMessage, args: string[]) {
    let url: string = this._DEFAULT_URL;

    if (args.length > 1) {
      await message.reply('Too many arguments, please try again.');
      return;
    }

    // if (args[0] === 'list') {
    //   await message.reply(this._VALID_TAGS);
    // }

    if (args.length === 1) {
      if (!this._VALID_TAGS.includes(args[0].toLowerCase())) {
        await message.reply('Invalid tag, use `!quote list for a list of valid tags`');
        return;
      }
      url = `${url}?tags=${args[0].toLowerCase()}`;
    }

    await this.container.httpService
      .get(url)
      .then((response: IHttpResponse) => {
        const content: string = response.data.content;
        const author: string = response.data.author;
        const tag: string =
          args.length > 0
            ? this._capitalizeTag(args[0])
            : this._capitalizeTag(response.data.tags[0]);

        const embed: MessageEmbed = this._createEmbed(content, author, tag);
        message.reply({ embeds: [embed] });
      })
      .catch((err) => this.container.loggerService.warn(err));
  }
}
