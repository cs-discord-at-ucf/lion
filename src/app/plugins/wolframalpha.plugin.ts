import { MessageAttachment, MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import Environment from '../../environment';
// @ts-ignore
import WolframAlphaAPI from 'wolfram-alpha-api';

export class WolframAlphaPlugin extends Plugin {
  private _defaultQuestion = 'What can you do?';
  private _imageOptions = ['image', 'img'];
  private _logoURL = 'https://www.symbols.com/images/symbol/2886_wolfram-alpha-logo.png';
  private _errorMessage = "Sorry, I don't know that one";

  public name: string = 'Wolfram Alpha';
  public description: string =
    'Ask wolfram alpha a question. \nProvide the first argument to get your answer as an image';
  public usage: string = `wa <${this._imageOptions.join(' | ')}>? <question>`;
  public pluginAlias = ['wa', 'wolfram', 'alpha', 'wolframalpha'];
  public permission: ChannelType = ChannelType.Public;

  constructor(public container: IContainer) {
    super();
    this.container.waApi = WolframAlphaAPI(Environment.WolframAppID);
  }

  public async execute(message: IMessage, args: string[]) {
    // connect to api

    // If the option for a image reponse is added, set a flag and remove from args
    const wantsImage = this._imageOptions.includes(args[0]);
    if (wantsImage) {
      args = args.slice(1);
    }

    // If no args, resort to our default question
    // Else, pretty up the question for processing
    const question =
      args.length === 0
        ? this._defaultQuestion
        : args.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');

    // Make template embed and pass it off to be filled in
    const embed = new MessageEmbed()
      .setTitle(`Question: "${question}"`)
      .setAuthor('Wolfram Alpha', this._logoURL, 'https://www.wolframalpha.com');

    await message.channel.send('Let me think...');

    try {
      if (wantsImage) {
        // put base64 image in an attachment
        const base64Str = await this.container.waApi.getSimple(question);
        const buffer = Buffer.from(base64Str.split(',')[1], 'base64');
        const file = new MessageAttachment(buffer);

        file.setName('image.png');
        embed.setDescription('Answer:');
        embed.attachFiles([file]).setImage(`attachment://${file.name}`);
        await message.channel.send(embed);
      } else {
        const answer = await this.container.waApi.getShort(question);

        // Append answer next to "Answer:" from the template embed
        embed.setDescription(`Answer: ${answer}`);
        await message.channel.send(embed);
      }
    } catch (error) {
      // Append answer next to "Answer:" from the template embed
      embed.setDescription(this._errorMessage);
      await message.channel.send(embed);
    }
  }
}
