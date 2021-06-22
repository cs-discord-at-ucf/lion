import { MessageAttachment, MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import Environment from '../../environment';
const WolframAlphaAPI = require('wolfram-alpha-api');

type EmbedTypes = 'short' | 'image' | 'error';

export class WolframAlphaPlugin extends Plugin {
  private _defaultQuestion = 'What can you do?';
  private _imageOption = ['image', 'img'];
  private _readableImageOption = this._imageOption.join(' | ');
  private _logoURL = 'https://www.symbols.com/images/symbol/2886_wolfram-alpha-logo.png';
  private _errorMessage = "Sorry, I don't know that one";

  public name: string = 'Wolfram Alpha';
  public description: string =
    'Ask wolfram alpha a question. \nProvide the first argument to get your answer as an image';
  public usage: string = `wa <${this._readableImageOption}>? <question>`;
  public pluginAlias = ['wa', 'wolfram', 'alpha', 'wolframalpha'];
  public permission: ChannelType = ChannelType.Public;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    // connect to api
    const waApi = WolframAlphaAPI(Environment.WolframAppID);

    // If the option for a image reponse is added, set a flag and remove from args
    const wantsImage = this._imageOption.includes(args[0]);
    if (wantsImage) {
      args = args.slice(1);
    }

    // If no args, resort to our default question
    // Else, pretty up the question for processing
    const question =
      args.length === 0
        ? this._defaultQuestion
        : args.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');

    const sendEmbed = async (message: IMessage, embed: MessageEmbed, embedType: EmbedTypes) => {
      switch (embedType) {
        case 'short':
          const answer = await waApi.getShort(question);

          // Append answer next to "Answer:" from the template embed
          embed.setDescription(`${embed.description} ${answer}`);
          message.channel.send(embed);
          break;
        case 'image':
          const image = await waApi.getSimple(question);

          // put base64 image in an attachment
          const base64Str = image;
          const buffer = Buffer.from(base64Str.split(',')[1], 'base64');
          const file = new MessageAttachment(buffer);

          file.setName('image.png');
          embed.attachFiles([file]).setImage(`attachment://${file.name}`);
          message.channel.send(embed);
          break;
        case 'error':
        default:
          embed.setDescription(this._errorMessage);
          message.channel.send(embed);
          break;
      }
    };

    // Make template embed and pass it off to be filled in
    const embed = new MessageEmbed();
    embed
      .setTitle(`Question: "${question}"`)
      .setDescription('Answer:')
      .setAuthor('Wolfram Alpha', this._logoURL, 'https://www.wolframalpha.com');

    await message.channel.send('Let me think...');

    try {
      wantsImage
        ? await sendEmbed(message, embed, 'image')
        : await sendEmbed(message, embed, 'short');
    } catch (error) {
      await sendEmbed(message, embed, 'error');
    }

    return;
  }
}
