import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage, Maybe } from '../../common/types';
import { MessageEmbed } from 'discord.js';

interface IQuote {
  tags: string[];
  content: string;
  author: string;
}

export default class QuotePlugin extends Plugin {
  public commandName: string = 'quote';
  public name: string = 'Quote Plugin';
  public description: string = 'Prints a random quote';
  public usage: string = 'quote\nquote <tag>\nquote list';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;

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

  public override validate(message: IMessage, args: string[]) {
    if (args.length > 1) {
      return false;
    }

    if (args.length === 0) {
      return true;
    }

    return args[0].toLowerCase() === 'list' || this._VALID_TAGS.includes(args[0].toLowerCase());
  }

  private _createEmbed(content: string, author: string, tag: string) {
    return new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(tag === 'Famous-quotes' ? 'Famous-Quotes' : tag)
      .setFooter('Pulled from api.quotable.io')
      .setTimestamp(new Date())
      .setDescription(`${content}\n\n- ${author}`);
  }

  private _capitalizeTag(tag: string) {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  public async execute(message: IMessage, args: string[]) {
    let url: string = this._DEFAULT_URL;
    const [tagArg] = args;

    // Only if there was a tag given
    if (tagArg) {
      if (tagArg.toLowerCase() === 'list') {
        await message.reply('**Valid tags:** ' + this._VALID_TAGS.join(', '));
        return;
      }

      url = `${url}?tags=${tagArg.toLowerCase()}`;
    }

    await this._replyWithQuote(message, url, tagArg);
  }

  // A tag as null will generate the first tag associated with the random quote
  private _replyWithQuote(message: IMessage, url: string, tag: Maybe<string>) {
    return this.container.httpService
      .get(url)
      .then((response: IHttpResponse) => {
        const quote = <IQuote>response.data;
        const { content, author } = response.data;

        const embed: MessageEmbed = this._createEmbed(
          content,
          author,
          this._capitalizeTag(tag ?? quote.tags[0])
        );
        message.reply({ embeds: [embed] });
      })
      .catch((err) => this.container.loggerService.warn(err));
  }
}
