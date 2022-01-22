import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export interface IAPIQuoteResponse {
  _id: string;
  tags: string[];
  content: string;
  author: string;
  authorSlug: string;
  length: number;
  dateAdded: string;
  dateModified: string;
}

export default class QuotePlugin extends Plugin {
  public commandName: string = 'quote';
  public name: string = 'Quote Plugin';
  public description: string = 'Prints a random quote';
  public usage: string = 'quote\nquote <tag>\nquote list';
  public permission: ChannelType = ChannelType.Public;

  private static readonly _DEFAULT_URL: string = 'https://api.quotable.io/random' as const;
  private static readonly _VALID_TAGS: readonly string[] = [
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
  ] as const;

  private static readonly _VALID_TAGS_LIST_STR = `**Valid tags:** ${QuotePlugin._VALID_TAGS.join(
    ', '
  )}`;

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

    const [tagInput] = args;
    return (
      tagInput.toLowerCase() === 'list' || QuotePlugin._VALID_TAGS.includes(tagInput.toLowerCase())
    );
  }

  private _createEmbed(content: string, author: string, tag: string) {
    return new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(tag === 'Famous-quotes' ? 'Famous-Quotes' : tag)
      .setFooter('Pulled from api.quotable.io')
      .setTimestamp(Date.now())
      .setDescription(`${content}\n\n- ${author}`);
  }

  private _capitalizeTag(tag: string) {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  public async execute(message: IMessage, args: string[]) {
    this.validate(message, args);
    const [inputTag] = args;
    const url: string =
      args.length === 1
        ? `${QuotePlugin._DEFAULT_URL}?tags=${inputTag.toLowerCase()}`
        : QuotePlugin._DEFAULT_URL;

    if (inputTag.toLowerCase() === 'list') {
      await message.reply(QuotePlugin._VALID_TAGS_LIST_STR);
      return;
    }

    const response = await this.container.httpService
      .get<IAPIQuoteResponse>(url)
      .catch((err) => this.container.loggerService.warn(err));

    if (!response) {
      return;
    }

    const { content, author } = response.data;
    const tag: string =
      args.length > 0 ? this._capitalizeTag(inputTag) : this._capitalizeTag(response.data.tags[0]);

    await message.reply({ embeds: [this._createEmbed(content, author, tag)] });
  }
}
