import { MessageAttachment } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, ChannelType, IMessage } from '../../common/types';
import axios from 'axios';
import Constants from '../../common/constants';

export default class EquationPlugin extends Plugin {
  public commandName: string = 'equation';
  public name: string = 'Equation Plugin';
  public description: string = 'A plugin that generated equations given a tex string.';
  public usage: string = 'eqn <equation> <image-height>';
  public permission: ChannelType = ChannelType.Public;
  public override commandPattern: RegExp = /^(?!\s*$).+/;
  public override pluginAlias: string[] = ['eqn'];
  public override pluginCategoryName: string = Constants.Categories.Help;

  private static readonly _BASE_URL = 'https://chart.googleapis.com/chart';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]): Promise<void> {
    // Define the properties of the image.
    const params = {
      cht: 'tx',
      chl: args.join(''),
      chs: 40,
      chf: 'bg,s,00000000',
      chco: 'FFFFFF',
    };

    // Fetch result. (Can't use container.httpServer because it doesn't allow options.)
    let result;
    try {
      result = await axios.get(EquationPlugin._BASE_URL, {
        params,
        responseType: 'arraybuffer',
      });
    } catch (err) {
      message.channel.send(
        'There was an error generating an equation, did you enter your equation properly?'
      );
      return;
    }

    // Capture buffer.
    const buffer = Buffer.from(result.data, 'base64');

    // Create attachment.
    const attachment = new MessageAttachment(buffer, 'equation.png');

    // Send message.
    await message.channel.send({ files: [attachment] });
  }
}
